import { registrer } from "./registry";

registrer("sigmoid", "Interaktiv sigmoidkurve", () => import("./Sigmoid"));
registrer("gradient-descent", "Interaktiv gradient descent", () => import("./GradientDescent"));
registrer("roc-terskel", "Terskel, confusion matrix og ROC-kurve", () => import("./RocTerskel"));
registrer("entropi-gini", "Entropi og Gini-indeks", () => import("./EntropiGini"));
registrer("bias-varians", "Bias og varians mot modellkompleksitet", () => import("./BiasVarians"));
registrer("gradient-boosting", "Gradient boosting steg for steg", () => import("./GradientBoosting"));
registrer("aktiveringer", "Aktiveringsfunksjoner og softmax", () => import("./Aktiveringer"));
registrer("kmeans", "k-means steg for steg", () => import("./KMeans"));
registrer("pca", "PCA i to dimensjoner", () => import("./Pca"));
registrer("epsilon-greedy", "Nedtrapping av epsilon", () => import("./EpsilonGreedy"));
registrer("shapley", "Shapley-kalkulator", () => import("./Shapley"));
registrer("nevralt-nettverk", "Diagram av et nevralt nettverk", () => import("./Diagrammer").then((m) => ({ default: m.NevraltNettverk })));
registrer("rl-lokke", "Agent og miljø i reinforcement learning", () => import("./Diagrammer").then((m) => ({ default: m.RlLokke })));
registrer("ai-act-risiko", "Risikonivåene i AI Act", () => import("./Diagrammer").then((m) => ({ default: m.AiActRisiko })));
