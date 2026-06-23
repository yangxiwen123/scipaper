/**
 * Mock Paper Data — Realistic agricultural logistics research scenario.
 *
 * TITLE: 基于多目标动态优化的农业物流路径规划方法与应用研究
 *
 * This file injects a complete, realistic SCI paper dataset into the
 * Zustand store for testing frontend robustness with complex technical
 * content (H-MODRL algorithm, cold chain logistics constraints, etc.).
 *
 * The data follows the exact content_json schema defined in
 * backend/app/models/paper.py for JSONB compatibility.
 */
import type { Paper, PaperSection, SectionContent, Paragraph, TextRun } from '../api/client';

// ============================================================================
// Section Content: Abstract
// ============================================================================

const MOCK_ABSTRACT: SectionContent = {
  paragraphs: [
    {
      id: 'abs-para-1',
      runs: [
        {
          type: 'text',
          text: 'Agricultural logistics path planning faces the dual challenge of minimizing transportation costs while preserving perishable product quality under dynamic environmental conditions. Traditional single-objective optimization methods fail to capture the multi-dimensional trade-offs inherent in cold chain distribution networks.',
          bold: false,
          italic: false,
        },
      ],
    },
    {
      id: 'abs-para-2',
      runs: [
        {
          type: 'text',
          text: 'This study proposes H-MODRL (Hybrid Multi-Objective Deep Reinforcement Learning), a novel framework integrating NSGA-II-based evolutionary search with proximal policy optimization (PPO) for dynamic agricultural vehicle routing. The algorithm simultaneously optimizes three objectives: total transportation cost, product freshness loss rate, and carbon emission intensity.',
          bold: false,
          italic: false,
        },
      ],
    },
    {
      id: 'abs-para-3',
      runs: [
        {
          type: 'text',
          text: 'Experimental validation on real-world logistics datasets from Shouguang (Shandong, China) — the largest vegetable distribution hub in northern China — demonstrates that H-MODRL achieves a 17.3% reduction in cold chain loss rate and a 12.8% reduction in total cost compared to the best-performing baseline (MOEA/D-DE). These results confirm the practical viability of deep reinforcement learning for sustainable agricultural supply chain optimization.',
          bold: false,
          italic: false,
        },
      ],
    },
  ],
  phrases_used: [],
  figures_refs: [],
  table_refs: [],
};

// ============================================================================
// Section Content: Introduction
// ============================================================================

const MOCK_INTRODUCTION: SectionContent = {
  paragraphs: [
    {
      id: 'intro-para-1',
      runs: [
        {
          type: 'text',
          text: 'Agricultural logistics is the backbone of food security infrastructure. In China alone, post-harvest losses in the vegetable supply chain exceed 25% annually, with transportation-related spoilage accounting for approximately 40% of these losses (Li et al., 2023). The problem is particularly acute for cold chain logistics, where even minor deviations from optimal temperature and humidity conditions can trigger irreversible quality degradation in perishable agricultural products.',
          bold: false,
          italic: false,
        },
      ],
    },
    {
      id: 'intro-para-2',
      runs: [
        {
          type: 'text',
          text: 'Despite considerable research on vehicle routing problems (VRP) for general logistics, the specific constraints of agricultural cold chain transportation — including time-varying road conditions, multi-commodity temperature requirements, and the coupled dynamics of product freshness decay — remain poorly understood. Existing approaches fall into two categories: (1) classical multi-objective evolutionary algorithms (MOEAs) such as NSGA-II, MOEA/D, and SPEA2, which provide strong global search capabilities but cannot adapt to real-time environmental changes; and (2) single-agent reinforcement learning methods, which offer dynamic adaptation but struggle with multi-objective trade-offs and sparse reward landscapes.',
          bold: false,
          italic: false,
        },
      ],
    },
    {
      id: 'intro-para-3',
      runs: [
        {
          type: 'text',
          text: 'The aim of this study is to develop and validate a hybrid multi-objective deep reinforcement learning (H-MODRL) framework that integrates the population-based global search of NSGA-II with the adaptive policy learning of PPO, specifically tailored for dynamic agricultural logistics path planning. We hypothesized that the hybrid architecture would outperform both pure evolutionary methods and pure reinforcement learning baselines on three key metrics: total logistics cost, product freshness retention rate, and carbon emission efficiency.',
          bold: false,
          italic: false,
        },
      ],
    },
  ],
  phrases_used: [],
  figures_refs: [],
  table_refs: [],
};

// ============================================================================
// Section Content: Methods — THE KEY SECTION with H-MODRL algorithm details
// ============================================================================

const MOCK_METHODS: SectionContent = {
  paragraphs: [
    // --- Study Design ---
    {
      id: 'meth-para-1',
      runs: [
        {
          type: 'text',
          text: 'A computational experiment design was employed to evaluate the proposed H-MODRL framework against established baselines. The experimental setup simulated a real-world agricultural logistics network comprising N = 50 distribution nodes (1 central cold storage hub + 49 retailer locations) across a 200 km × 200 km service area in Shouguang, Shandong Province.',
          bold: false,
          italic: false,
        },
      ],
    },
    // --- H-MODRL Architecture ---
    {
      id: 'meth-para-2',
      runs: [
        {
          type: 'text',
          text: 'H-MODRL Architecture. The proposed framework consists of three integrated components: (a) a multi-objective state encoder that transforms raw logistics state features (vehicle position, remaining capacity, current temperature, road congestion index, product elapsed time) into a 128-dimensional latent representation via a graph attention network (GAT) with 4 attention heads; (b) a dual-population evolutionary module running NSGA-II with population size P = 100 for 50 generations per decision epoch, where each chromosome encodes a complete delivery route sequence as a permutation vector with cold chain constraint repair operators; and (c) a PPO-based policy network with an actor-critic architecture (actor: 3 hidden layers [256, 128, 64] with ReLU activation; critic: 2 hidden layers [128, 64]) that learns from the NSGA-II Pareto front via a novel Pareto-guided experience replay buffer of size 10,000 transitions.',
          bold: false,
          italic: false,
        },
      ],
    },
    // --- Algorithm Pseudocode (as structured text) ---
    {
      id: 'meth-para-3',
      runs: [
        {
          type: 'text',
          text: 'Algorithm 1: H-MODRL Training Loop. Input: logistics network G(V, E), max episodes M = 2000, NSGA-II population P = 100, PPO clip ε = 0.2, discount factor γ = 0.99. For each episode t = 1 to M: (Step 1) Observe state s_t from environment simulator; (Step 2) Encode s_t via GAT encoder → latent vector z_t; (Step 3) Generate initial population via policy network π_θ(a|z_t) with ε-greedy exploration (ε annealing from 1.0 to 0.05 over first 500 episodes); (Step 4) Run NSGA-II for 50 generations: non-dominated sorting → crowding distance assignment → tournament selection (k = 2) → partially matched crossover (p_c = 0.9) → swap mutation (p_m = 0.1) → cold chain feasibility repair; (Step 5) Extract Pareto front F_t; (Step 6) Compute PPO advantage estimates using generalized advantage estimation (GAE, λ = 0.95) on F_t trajectories; (Step 7) Update policy π_θ via clipped surrogate objective; (Step 8) Decode action a_t = argmax_a π_θ(a|z_t); (Step 9) Execute a_t, receive reward vector r_t = [r_cost, r_freshness, r_carbon], transition to s_{t+1}. End for.',
          bold: false,
          italic: false,
        },
      ],
    },
    // --- Objective Functions ---
    {
      id: 'meth-para-4',
      runs: [
        {
          type: 'text',
          text: 'Objective Functions. Three competing objectives are simultaneously minimized: (1) Total Transportation Cost: f₁ = Σ_{i,j∈V} c_{ij}·x_{ijk} + Σ_{k∈K} f_k·y_k, where c_{ij} is the distance-based cost between nodes i and j, x_{ijk} is a binary decision variable indicating whether vehicle k traverses edge (i,j), f_k is the fixed cost of deploying vehicle k, and y_k is a binary vehicle deployment indicator; (2) Product Freshness Loss Rate: f₂ = (1/|P|) Σ_{p∈P} [1 - exp(-λ_p · Δt_p)], where P is the set of perishable products, λ_p is the decay rate of product p (dependent on temperature deviation from the optimal range [2°C, 8°C]), and Δt_p is the elapsed time since loading; (3) Carbon Emission Intensity: f₃ = Σ_{k∈K} [e_f · d_k · ρ(l_k) + e_r · d_k · (1 - ρ(l_k))], where e_f and e_r are emission factors for full-load and return trips, d_k is the total distance traveled by vehicle k, and ρ(l_k) is the average load ratio.',
          bold: false,
          italic: false,
        },
      ],
    },
    // --- Cold Chain Constraints ---
    {
      id: 'meth-para-5',
      runs: [
        {
          type: 'text',
          text: 'Cold Chain Constraints. Vehicle routes must satisfy the following hard constraints: (C1) Time Window: each retailer j must be served within its specified time window [e_j, l_j] where e_j and l_j are the earliest and latest acceptable delivery times; violation incurs a penalty φ·max(0, t_j - l_j) added to f₁; (C2) Temperature Continuity: the refrigerated compartment temperature T_k(t) must remain within [2°C, 8°C] for vegetable products and [-18°C, -12°C] for frozen products throughout the entire route, monitored at 5-minute intervals; (C3) Capacity: Σ_{i∈V} q_i·z_{ik} ≤ Q_k for all vehicles k, where q_i is the demand quantity at node i, z_{ik} indicates whether node i is served by vehicle k, and Q_k is the vehicle capacity (set to 5 tonnes for standard refrigerated trucks); (C4) Maximum Route Duration: each route must be completed within T_max = 10 hours to comply with food safety regulations.',
          bold: false,
          italic: false,
        },
      ],
    },
    // --- Parameter Settings ---
    {
      id: 'meth-para-6',
      runs: [
        {
          type: 'text',
          text: 'Parameter Settings. H-MODRL hyperparameters were tuned via grid search on a held-out validation set of 10 logistics instances (distinct from the 30 test instances): GAT encoder: 4 attention heads, 128-dim hidden, dropout = 0.1; NSGA-II: population P = 100, generations G = 50, crossover p_c = 0.9 (partially matched crossover), mutation p_m = 0.1 (swap mutation); PPO: learning rate α = 3×10⁻⁴ (Adam optimizer, β₁ = 0.9, β₂ = 0.999), clip ε = 0.2, GAE λ = 0.95, entropy coefficient c_ent = 0.01, value loss coefficient c_v = 0.5, mini-batch size = 64, epochs per update = 10; Reward scaling: each objective r_i is normalized to [0,1] via min-max scaling based on running statistics over the last 100 episodes.',
          bold: false,
          italic: false,
        },
      ],
    },
    // --- Baselines ---
    {
      id: 'meth-para-7',
      runs: [
        {
          type: 'text',
          text: 'Baseline Methods. H-MODRL is compared against five established approaches: (1) NSGA-II (Deb et al., 2002) — the canonical multi-objective evolutionary algorithm with non-dominated sorting; (2) MOEA/D-DE (Li & Zhang, 2009) — decomposition-based multi-objective optimization with differential evolution; (3) PPO-AM (Kool et al., 2019) — single-objective PPO with attention-based policy for vehicle routing; (4) MODRL-SA (Li et al., 2021) — multi-objective DRL using scalarized rewards with equal weighting (w₁ = w₂ = w₃ = 1/3); and (5) a greedy heuristic (GH) that selects the nearest unvisited node with the earliest deadline first, commonly used in commercial logistics software.',
          bold: false,
          italic: false,
        },
      ],
    },
    // --- Evaluation Metrics ---
    {
      id: 'meth-para-8',
      runs: [
        {
          type: 'text',
          text: 'Evaluation Metrics. Algorithm performance is assessed using: (a) Hypervolume (HV) — the volume of the objective space dominated by the obtained Pareto front relative to a reference point (nadir vector estimated from all runs); (b) Inverted Generational Distance (IGD) — average Euclidean distance from each point on the true Pareto front (approximated by merging all algorithm outputs across 30 runs) to the nearest point on the obtained front; (c) Spread (Δ) — the diversity metric measuring the extent of the obtained front along each objective dimension. All experiments were repeated over 30 independent runs with different random seeds. Statistical significance was assessed using the Wilcoxon signed-rank test with Bonferroni correction (α = 0.05/3 = 0.0167 for three pairwise comparisons).',
          bold: false,
          italic: false,
        },
      ],
    },
  ],
  phrases_used: [],
  figures_refs: ['fig:modrl_architecture', 'fig:convergence_curve'],
  table_refs: ['tab:parameter_settings', 'tab:benchmark_results'],
};

// ============================================================================
// Section Content: Results
// ============================================================================

const MOCK_RESULTS: SectionContent = {
  paragraphs: [
    {
      id: 'res-para-1',
      runs: [
        {
          type: 'text',
          text: 'A significant improvement in all three objectives was observed for H-MODRL compared to the best-performing baseline (MOEA/D-DE). On the 30-instance Shouguang test set, H-MODRL achieved a mean total cost of ¥2,847.3 (SD = 312.5), a mean freshness loss rate of 4.21% (SD = 0.83%), and a mean carbon emission intensity of 18.7 kg CO₂ per tonne-km (SD = 2.1). In contrast, MOEA/D-DE yielded ¥3,265.8 (SD = 378.2), 5.09% (SD = 0.97%), and 21.4 kg CO₂/t-km (SD = 2.6) respectively. The differences were statistically significant for all three metrics (Wilcoxon signed-rank test, p < 0.001 for cost and freshness; p = 0.004 for carbon emission, all surviving Bonferroni correction).',
          bold: false,
          italic: false,
        },
      ],
    },
    {
      id: 'res-para-2',
      runs: [
        {
          type: 'text',
          text: 'As shown in Figure 1, the Pareto front produced by H-MODRL dominates 94.3% of the solutions generated by MOEA/D-DE across all 30 test instances, as measured by the C-metric (set coverage). The hypervolume of H-MODRL (HV = 0.873, normalized) exceeded that of MOEA/D-DE (HV = 0.741) by 17.8%. Table 2 summarizes the full comparison across all baseline methods.',
          bold: false,
          italic: false,
        },
      ],
    },
    {
      id: 'res-para-3',
      runs: [
        {
          type: 'text',
          text: 'Ablation Study. To quantify the contribution of each architectural component, we conducted a systematic ablation analysis: (a) removing the GAT encoder and replacing it with a simple MLP degraded hypervolume by 8.2%; (b) removing the NSGA-II module (i.e., pure PPO with scalarized rewards) reduced HV by 12.7%; (c) removing the Pareto-guided experience replay and using uniform sampling decreased HV by 5.4%; (d) removing the cold chain constraint repair operators caused 23.1% of generated routes to violate capacity or temperature constraints, rendering them infeasible. These results confirm that all components contribute meaningfully to the overall performance.',
          bold: false,
          italic: false,
        },
      ],
    },
    {
      id: 'res-para-4',
      runs: [
        {
          type: 'text',
          text: 'A moderate positive correlation was observed between problem instance size (number of delivery nodes) and the performance gap between H-MODRL and pure evolutionary methods, r(28) = 0.54, p = 0.002. This suggests that H-MODRL scales more favorably to larger logistics networks, likely due to the learned policy generalizing across problem sizes while NSGA-II must search from scratch for each new instance.',
          bold: false,
          italic: false,
        },
      ],
    },
  ],
  phrases_used: [],
  figures_refs: ['fig:pareto_front_comparison', 'fig:ablation_results'],
  table_refs: ['tab:full_benchmark_comparison'],
};

// ============================================================================
// Section Content: Discussion
// ============================================================================

const MOCK_DISCUSSION: SectionContent = {
  paragraphs: [
    {
      id: 'disc-para-1',
      runs: [
        {
          type: 'text',
          text: 'These findings are consistent with our hypothesis that integrating evolutionary multi-objective search with policy gradient reinforcement learning yields superior performance for dynamic agricultural logistics planning. The 17.3% reduction in cold chain loss rate is practically significant — when applied to the Shouguang logistics network (annual throughput ≈ 5 million tonnes), this translates to an estimated ¥120 million in annual savings from reduced vegetable spoilage alone.',
          bold: false,
          italic: false,
        },
      ],
    },
    {
      id: 'disc-para-2',
      runs: [
        {
          type: 'text',
          text: 'Our finding that the GAT encoder contributes 8.2% to hypervolume performance aligns with previous work by Kool et al. (2019), who demonstrated the importance of attention-based encoders for routing problems. However, the critical role of the cold chain constraint repair operators (23.1% infeasibility without them) extends the literature by showing that domain-specific constraint handling is not merely a convenience but a necessity for real-world agricultural logistics applications.',
          bold: false,
          italic: false,
        },
      ],
    },
    {
      id: 'disc-para-3',
      runs: [
        {
          type: 'text',
          text: 'Several limitations should be noted. First, the simulation assumes real-time availability of road condition data via IoT sensors — this infrastructure is not yet universally deployed in rural agricultural areas. Second, the model does not account for extreme weather events (typhoons, snowstorms) that can disrupt logistics networks entirely rather than merely changing travel times. Third, the Shouguang dataset represents a specific geographic and commodity context; generalization to other agricultural regions (e.g., tropical fruit supply chains in Southeast Asia) requires additional validation. Future research should examine whether the H-MODRL framework can incorporate multimodal transportation (combining road, rail, and short-haul air freight) and whether federated learning can enable privacy-preserving model sharing across competing logistics companies.',
          bold: false,
          italic: false,
        },
      ],
    },
  ],
  phrases_used: [],
  figures_refs: [],
  table_refs: [],
};

// ============================================================================
// Section Content: Conclusion
// ============================================================================

const MOCK_CONCLUSION: SectionContent = {
  paragraphs: [
    {
      id: 'conc-para-1',
      runs: [
        {
          type: 'text',
          text: 'In conclusion, this study demonstrates that the H-MODRL framework — integrating NSGA-II evolutionary search with PPO-based policy learning — significantly outperforms existing methods on multi-objective agricultural logistics path planning. The hybrid architecture provides a principled mechanism for balancing three competing objectives (cost, freshness, carbon emission) while respecting hard cold chain constraints in dynamic environments.',
          bold: false,
          italic: false,
        },
      ],
    },
    {
      id: 'conc-para-2',
      runs: [
        {
          type: 'text',
          text: 'This work makes two key contributions to the agricultural logistics literature: (i) methodological — a novel Pareto-guided experience replay mechanism that bridges the gap between population-based evolutionary optimization and sample-efficient policy gradient learning; and (ii) practical — an end-to-end framework validated on real-world data from China\'s largest vegetable logistics hub, demonstrating that deep reinforcement learning is ready for deployment in sustainable food supply chain management.',
          bold: false,
          italic: false,
        },
      ],
    },
  ],
  phrases_used: [],
  figures_refs: [],
  table_refs: [],
};

// ============================================================================
// Assembled Mock Sections
// ============================================================================

const SECTION_CONTENT_MAP: Record<string, SectionContent> = {
  abstract: MOCK_ABSTRACT,
  introduction: MOCK_INTRODUCTION,
  methods: MOCK_METHODS,
  results: MOCK_RESULTS,
  discussion: MOCK_DISCUSSION,
  conclusion: MOCK_CONCLUSION,
};

// ============================================================================
// Mock Paper
// ============================================================================

export const MOCK_PAPER: Paper = {
  id: 'mock-paper-hmodrl-001',
  user_id: 'mock-user-001',
  title: '基于多目标动态优化的农业物流路径规划方法与应用研究',
  status: 'in_progress',
  journal_target: 'IEEE Transactions on Intelligent Transportation Systems',
  citation_style: 'ieee',
  created_at: '2026-03-15T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z',
};

// ============================================================================
// Mock Sections (compatible with PaperSection interface)
// ============================================================================

export const MOCK_SECTIONS: Record<string, PaperSection> = {
  abstract: {
    id: 'mock-sec-abstract',
    paper_id: 'mock-paper-hmodrl-001',
    section_name: 'abstract',
    content_json: MOCK_ABSTRACT as any,
    plain_text: 'Agricultural logistics path planning faces the dual challenge...',
    word_count: 187,
    is_complete: true,
    updated_at: '2026-06-20T00:00:00Z',
  },
  introduction: {
    id: 'mock-sec-intro',
    paper_id: 'mock-paper-hmodrl-001',
    section_name: 'introduction',
    content_json: MOCK_INTRODUCTION as any,
    plain_text: 'Agricultural logistics is the backbone of food security infrastructure...',
    word_count: 312,
    is_complete: true,
    updated_at: '2026-06-20T00:00:00Z',
  },
  methods: {
    id: 'mock-sec-methods',
    paper_id: 'mock-paper-hmodrl-001',
    section_name: 'methods',
    content_json: MOCK_METHODS as any,
    plain_text: 'A computational experiment design was employed...',
    word_count: 987,
    is_complete: true,
    updated_at: '2026-06-20T00:00:00Z',
  },
  results: {
    id: 'mock-sec-results',
    paper_id: 'mock-paper-hmodrl-001',
    section_name: 'results',
    content_json: MOCK_RESULTS as any,
    plain_text: 'A significant improvement in all three objectives was observed...',
    word_count: 445,
    is_complete: true,
    updated_at: '2026-06-20T00:00:00Z',
  },
  discussion: {
    id: 'mock-sec-discussion',
    paper_id: 'mock-paper-hmodrl-001',
    section_name: 'discussion',
    content_json: MOCK_DISCUSSION as any,
    plain_text: 'These findings are consistent with our hypothesis...',
    word_count: 378,
    is_complete: true,
    updated_at: '2026-06-20T00:00:00Z',
  },
  conclusion: {
    id: 'mock-sec-conclusion',
    paper_id: 'mock-paper-hmodrl-001',
    section_name: 'conclusion',
    content_json: MOCK_CONCLUSION as any,
    plain_text: 'In conclusion, this study demonstrates that the H-MODRL framework...',
    word_count: 165,
    is_complete: true,
    updated_at: '2026-06-20T00:00:00Z',
  },
};

// ============================================================================
// Quick-load function for demo initialization
// ============================================================================

export function loadMockPaperData() {
  return {
    paper: { ...MOCK_PAPER },
    sections: { ...MOCK_SECTIONS },
  };
}

export { SECTION_CONTENT_MAP };
