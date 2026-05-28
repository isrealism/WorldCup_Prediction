"""
model.py — 模型训练、评估与预测

包含：
  1. 时间序列交叉验证（防止数据泄露）
  2. 三分类（W/D/L）+ 泊松进球回归（双模型）
  3. 四种算法对比：LogReg / RandomForest / XGBoost / LightGBM
  4. 概率校准
  5. 特征重要性分析
  6. 模型保存 & 预测接口

用法:
    python model.py --train         # 训练全部模型
    python model.py --eval          # 评估 + 对比
    python model.py --importance    # 特征重要性
    python model.py --predict "Brazil" "France"   # 预测一场比赛
"""

import argparse
import pickle
import warnings
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression, PoissonRegressor
from sklearn.metrics import (
    accuracy_score, log_loss, brier_score_loss,
    classification_report, confusion_matrix,
)
from sklearn.model_selection import TimeSeriesSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, LabelEncoder

warnings.filterwarnings("ignore")

try:
    import xgboost as xgb
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    print("[warn] xgboost 未安装，跳过 XGBoost 模型")

try:
    import lightgbm as lgb
    HAS_LGB = True
except ImportError:
    HAS_LGB = False
    print("[warn] lightgbm 未安装，跳过 LightGBM 模型")

PROC    = Path("data/processed")
MODELS  = Path("models")
MODELS.mkdir(parents=True, exist_ok=True)

# ── 元数据列（不作为特征）────────────────────────────────────────────────────
META_COLS = {
    "match_id", "utc_date", "competition", "season", "stage",
    "home_team", "away_team",
}
LABEL_COLS = {
    "result", "result_num", "home_goals", "away_goals",
    "went_to_et", "went_to_pen",
}


# ══════════════════════════════════════════════════════════════════════════════
# 工具函数
# ══════════════════════════════════════════════════════════════════════════════

def rps(y_true_encoded: np.ndarray, proba: np.ndarray, n_classes: int = 3) -> float:
    """
    Ranked Probability Score — 体育预测标准评估指标。
    越低越好，完美预测 = 0，随机猜测 ≈ 0.33（三分类）。
    """
    total = 0.0
    for i in range(len(y_true_encoded)):
        cum_pred = np.cumsum(proba[i])
        cum_true = np.cumsum(np.eye(n_classes)[y_true_encoded[i]])
        total += np.sum((cum_pred - cum_true) ** 2)
    return total / (len(y_true_encoded) * (n_classes - 1))


def load_features() -> tuple[pd.DataFrame, np.ndarray, np.ndarray, np.ndarray]:
    """加载特征矩阵，返回 (X, y_result, y_home_goals, y_away_goals)。"""
    path = PROC / "features.parquet"
    if not path.exists():
        raise FileNotFoundError("找不到 features.parquet，请先运行 features.py --build")

    df = pd.read_parquet(path).sort_values("utc_date")

    # 去掉元数据和标签
    drop_cols = META_COLS | LABEL_COLS
    feat_cols = [c for c in df.columns if c not in drop_cols]

    # 只保留数值列
    X = df[feat_cols].select_dtypes(include="number")

    # 填充缺失（中位数）
    X = X.fillna(X.median())

    # 标签
    le = LabelEncoder()
    le.fit(["L", "D", "W"])             # 固定顺序：L=0, D=1, W=2
    y_result     = le.transform(df["result"])
    y_home_goals = df["home_goals"].values.astype(float)
    y_away_goals = df["away_goals"].values.astype(float)

    print(f"特征矩阵: {X.shape[0]:,} 场 × {X.shape[1]} 特征")
    print(f"标签分布: {dict(zip(le.classes_, np.bincount(y_result)))}")

    return X, y_result, y_home_goals, y_away_goals, df, le


def time_split(n: int, n_splits: int = 5, test_size: float = 0.15):
    """
    时间序列分割 — 训练集只用历史数据，防止未来信息泄露。
    test_size: 每折测试集占总数据比例。
    """
    tscv = TimeSeriesSplit(
        n_splits=n_splits,
        test_size=int(n * test_size),
    )
    return tscv


# ══════════════════════════════════════════════════════════════════════════════
# 模型定义
# ══════════════════════════════════════════════════════════════════════════════

def build_classifiers() -> dict:
    models = {
        "LogReg": Pipeline([
            ("scaler", StandardScaler()),
            ("clf",    LogisticRegression(
                max_iter=2000, C=0.5,
                class_weight="balanced",
                multi_class="multinomial",
                solver="lbfgs",
            )),
        ]),
        "RandomForest": RandomForestClassifier(
            n_estimators=500, max_depth=6,
            min_samples_leaf=5, class_weight="balanced",
            random_state=42, n_jobs=-1,
        ),
    }

    if HAS_XGB:
        models["XGBoost"] = xgb.XGBClassifier(
            n_estimators=500, max_depth=5,
            learning_rate=0.05, subsample=0.8,
            colsample_bytree=0.8, use_label_encoder=False,
            eval_metric="mlogloss", random_state=42,
            n_jobs=-1,
        )

    if HAS_LGB:
        models["LightGBM"] = lgb.LGBMClassifier(
            n_estimators=500, max_depth=5,
            learning_rate=0.05, subsample=0.8,
            colsample_bytree=0.8, class_weight="balanced",
            random_state=42, n_jobs=-1, verbose=-1,
        )

    return models


def build_poisson_models() -> dict:
    """泊松回归：分别预测主客队进球数，再推导比赛结果概率。"""
    return {
        "home_goals": Pipeline([
            ("scaler", StandardScaler()),
            ("reg",    PoissonRegressor(alpha=0.5, max_iter=500)),
        ]),
        "away_goals": Pipeline([
            ("scaler", StandardScaler()),
            ("reg",    PoissonRegressor(alpha=0.5, max_iter=500)),
        ]),
    }


# ══════════════════════════════════════════════════════════════════════════════
# 训练与评估
# ══════════════════════════════════════════════════════════════════════════════

def cross_validate_all(X, y_result, n_splits=5) -> pd.DataFrame:
    """对所有分类器做时间序列交叉验证，返回评估结果。"""
    classifiers = build_classifiers()
    tscv = time_split(len(X), n_splits)
    results = []

    for name, clf in classifiers.items():
        print(f"\n  [{name}] 交叉验证中...")
        fold_accs, fold_lls, fold_rps = [], [], []

        for fold, (tr_idx, te_idx) in enumerate(tscv.split(X), 1):
            X_tr, X_te = X.iloc[tr_idx], X.iloc[te_idx]
            y_tr, y_te = y_result[tr_idx], y_result[te_idx]

            # 校准分类器（Platt Scaling）
            cal = CalibratedClassifierCV(clf, cv=3, method="isotonic")
            cal.fit(X_tr, y_tr)

            proba = cal.predict_proba(X_te)
            preds = np.argmax(proba, axis=1)

            fold_accs.append(accuracy_score(y_te, preds))
            fold_lls.append(log_loss(y_te, proba))
            fold_rps.append(rps(y_te, proba))
            print(f"    fold {fold}: acc={fold_accs[-1]:.3f}  ll={fold_lls[-1]:.3f}  rps={fold_rps[-1]:.3f}")

        results.append({
            "model":    name,
            "acc_mean": np.mean(fold_accs),
            "acc_std":  np.std(fold_accs),
            "logloss":  np.mean(fold_lls),
            "rps":      np.mean(fold_rps),
        })

    return pd.DataFrame(results).sort_values("rps")


def train_final(X, y_result, y_home, y_away, best_name: str):
    """在全量数据上训练最终模型。"""
    print(f"\n在全量数据上训练最终模型: {best_name}")
    classifiers = build_classifiers()
    clf = classifiers[best_name]
    cal = CalibratedClassifierCV(clf, cv=5, method="isotonic")
    cal.fit(X, y_result)

    # 泊松进球回归
    poisson = build_poisson_models()
    poisson["home_goals"].fit(X, y_home)
    poisson["away_goals"].fit(X, y_away)

    # 保存
    with open(MODELS / "classifier.pkl", "wb") as f:
        pickle.dump({"model": cal, "name": best_name}, f)
    with open(MODELS / "poisson.pkl", "wb") as f:
        pickle.dump(poisson, f)

    print(f"✅ 模型保存至 models/")
    return cal, poisson


# ══════════════════════════════════════════════════════════════════════════════
# 特征重要性
# ══════════════════════════════════════════════════════════════════════════════

def feature_importance(X, y_result):
    """用 XGBoost 或 RandomForest 输出 Top 特征。"""
    print("\n── 特征重要性 ──────────────────────────────────────────────────")

    if HAS_XGB:
        clf = xgb.XGBClassifier(
            n_estimators=200, max_depth=5, learning_rate=0.1,
            eval_metric="mlogloss", random_state=42, n_jobs=-1,
        )
    else:
        clf = RandomForestClassifier(n_estimators=200, random_state=42, n_jobs=-1)

    clf.fit(X, y_result)
    imp = pd.Series(clf.feature_importances_, index=X.columns)
    top = imp.sort_values(ascending=False).head(25)

    print(f"\nTop 25 特征：\n")
    for feat, score in top.items():
        bar = "█" * int(score * 200)
        print(f"  {feat:<40} {score:.4f}  {bar}")

    top.to_frame("importance").to_csv(MODELS / "feature_importance.csv")
    print(f"\n保存至 models/feature_importance.csv")
    return top


# ══════════════════════════════════════════════════════════════════════════════
# 预测接口
# ══════════════════════════════════════════════════════════════════════════════

def predict_match(home_team: str, away_team: str, feature_overrides: dict = None):
    """
    预测一场比赛。
    feature_overrides: 可手动传入特征值（如赔率、FIFA排名等）。
    """
    # 加载模型
    try:
        with open(MODELS / "classifier.pkl", "rb") as f:
            clf_data = pickle.load(f)
        with open(MODELS / "poisson.pkl", "rb") as f:
            poisson = pickle.load(f)
    except FileNotFoundError:
        print("模型文件不存在，请先运行 --train")
        return

    clf = clf_data["model"]

    # 从特征矩阵中找历史平均值作为基线
    feat_path = PROC / "features.parquet"
    df = pd.read_parquet(feat_path).sort_values("utc_date")

    drop_cols = META_COLS | LABEL_COLS
    feat_cols = [c for c in df.columns if c not in drop_cols]
    X_ref = df[feat_cols].select_dtypes(include="number")

    # 找两队历史特征均值
    home_rows = df[df["home_team"].str.contains(home_team, case=False, na=False)]
    away_rows = df[df["away_team"].str.contains(away_team, case=False, na=False)]

    if home_rows.empty or away_rows.empty:
        print(f"找不到 {home_team} 或 {away_team} 的历史数据，使用全局均值")
        x_input = X_ref.median().to_frame().T
    else:
        h_feat = home_rows[feat_cols].select_dtypes(include="number").tail(5).median()
        a_feat = away_rows[feat_cols].select_dtypes(include="number").tail(5).median()
        x_input = ((h_feat + a_feat) / 2).to_frame().T

    x_input = x_input.fillna(X_ref.median())

    # 手动覆盖特征
    if feature_overrides:
        for k, v in feature_overrides.items():
            if k in x_input.columns:
                x_input[k] = v

    # 分类预测
    proba = clf.predict_proba(x_input)[0]
    labels = ["L", "D", "W"]                      # LabelEncoder 顺序
    prob_dict = dict(zip(labels, proba))

    # 泊松进球预测
    home_goals_exp = poisson["home_goals"].predict(x_input)[0]
    away_goals_exp = poisson["away_goals"].predict(x_input)[0]

    # 从泊松分布推导精确比分概率（最可能的几个）
    from scipy.stats import poisson as scipy_poisson
    score_probs = {}
    for hg in range(6):
        for ag in range(6):
            p = (scipy_poisson.pmf(hg, home_goals_exp) *
                 scipy_poisson.pmf(ag, away_goals_exp))
            score_probs[f"{hg}-{ag}"] = p

    top_scores = sorted(score_probs.items(), key=lambda x: -x[1])[:5]

    # 输出
    print(f"\n{'='*55}")
    print(f"  {home_team}  vs  {away_team}")
    print(f"{'='*55}")
    print(f"\n  结果概率（分类模型）：")
    print(f"    {home_team} 胜:  {prob_dict['W']*100:5.1f}%")
    print(f"    平局:            {prob_dict['D']*100:5.1f}%")
    print(f"    {away_team} 胜:  {prob_dict['L']*100:5.1f}%")
    print(f"\n  期望进球（泊松模型）：")
    print(f"    {home_team}: {home_goals_exp:.2f}  |  {away_team}: {away_goals_exp:.2f}")
    print(f"\n  最可能比分：")
    for score, prob in top_scores:
        bar = "█" * int(prob * 100)
        print(f"    {score:<6} {prob*100:4.1f}%  {bar}")
    print()

    return {
        "home_win":   prob_dict["W"],
        "draw":       prob_dict["D"],
        "away_win":   prob_dict["L"],
        "home_goals_exp": home_goals_exp,
        "away_goals_exp": away_goals_exp,
        "top_scores": dict(top_scores),
    }


# ══════════════════════════════════════════════════════════════════════════════
# CLI
# ══════════════════════════════════════════════════════════════════════════════

def cmd_train():
    X, y_result, y_home, y_away, df, le = load_features()

    print("\n── 交叉验证对比 ─────────────────────────────────────────────────")
    results = cross_validate_all(X, y_result)

    print("\n\n模型对比（按 RPS 排序，越低越好）：\n")
    print(results.to_string(index=False, float_format="{:.4f}".format))

    best = results.iloc[0]["model"]
    print(f"\n最优模型: {best}")

    results.to_csv(MODELS / "cv_results.csv", index=False)
    train_final(X, y_result, y_home, y_away, best)


def cmd_eval():
    path = MODELS / "cv_results.csv"
    if not path.exists():
        print("请先运行 --train"); return

    results = pd.read_csv(path)
    print("\n── 模型评估结果 ─────────────────────────────────────────────────\n")
    print(results.to_string(index=False, float_format="{:.4f}".format))

    print("\n  指标说明：")
    print("    acc     准确率（直接预测胜/平/负正确率）")
    print("    logloss 对数损失（概率质量，越低越好）")
    print("    rps     Ranked Probability Score（体育预测标准指标，越低越好）")
    print("            随机猜测 ≈ 0.333，好模型一般在 0.19~0.22")


def cmd_importance():
    X, y_result, *_ = load_features()
    feature_importance(X, y_result)


def main():
    parser = argparse.ArgumentParser(description="世界杯预测模型")
    parser.add_argument("--train",      action="store_true")
    parser.add_argument("--eval",       action="store_true")
    parser.add_argument("--importance", action="store_true")
    parser.add_argument("--predict",    nargs=2, metavar=("HOME", "AWAY"),
                        help="预测一场比赛，例如: --predict Brazil France")
    args = parser.parse_args()

    if args.train:      cmd_train()
    if args.eval:       cmd_eval()
    if args.importance: cmd_importance()
    if args.predict:
        predict_match(args.predict[0], args.predict[1])

    if not any(vars(args).values()):
        parser.print_help()


if __name__ == "__main__":
    main()