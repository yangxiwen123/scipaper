/**
 * SCI 论文章节结构化表单定义
 *
 * 每个章节被拆解为带标签的子字段。
 * 普通人不需要知道 IMRaD 是什么——只需要按顺序填写每个"填空题"即可。
 */
export type FieldType = 'textarea' | 'input' | 'select' | 'number' | 'richtext';

export interface FormField {
  key: string;
  label: string;
  hint: string;
  placeholder: string;
  type: FieldType;
  options?: { label: string; value: string }[];
  words?: [number, number];
  required: boolean;
  example?: string;
}

export interface SectionSchema {
  sectionKey: string;
  title: string;
  description: string;
  fields: FormField[];
}

export type FieldValues = Record<string, string>;

export const SECTION_SCHEMAS: Record<string, SectionSchema> = {

  abstract: {
    sectionKey: 'abstract',
    title: '摘要',
    description: '摘要是论文的"名片"，让审稿人30秒内了解你的研究。按顺序填写下面5个小框，系统会帮你组合成一段流畅的摘要。每个框写 1-3 句话就够了。',
    fields: [
      {
        key: 'background',
        label: '① 背景 — 这个领域为什么重要？',
        hint: '用 1-2 句话说明你的研究领域为什么值得关注。不需要太详细，只要让读者知道"这是件重要的事"。',
        placeholder: '比如：冷链物流是保障食品安全的关键环节，但我国果蔬运输损耗率高达 25%……',
        type: 'textarea',
        words: [15, 60],
        required: true,
        example: '农产品供应链的产后损耗是影响全球粮食安全的重要因素，在发展中国家，运输环节的损失尤为严重。',
      },
      {
        key: 'objective',
        label: '② 目的 — 你做了什么？',
        hint: '用 1 句话说明这篇论文的研究目标。用"研究"、"探究"、"验证"这类动词。',
        placeholder: '比如：本研究旨在探究 X 对 Y 的影响……',
        type: 'textarea',
        words: [8, 40],
        required: true,
        example: '本研究旨在开发一种混合多目标优化算法，以同时降低农产品冷链运输的成本和损耗率。',
      },
      {
        key: 'methods',
        label: '③ 方法 — 你是怎么做的？',
        hint: '用 1-2 句话说明你用了什么方法。用了什么数据？做了实验还是调查？样本量是多少？用什么工具分析的？',
        placeholder: '比如：研究采用问卷调查法，对 300 名参与者进行了为期 6 个月的跟踪调查……',
        type: 'textarea',
        words: [15, 60],
        required: true,
        example: '本研究基于某省 50 个物流节点的真实运营数据，采用计算实验方法，将所提算法与五种已有方法进行了对比测试。',
      },
      {
        key: 'results',
        label: '④ 关键结果 — 你发现了什么？',
        hint: '写出最重要的 1-2 个数字结果。如果有统计检验，加上 p 值会更专业。',
        placeholder: '比如：实验组的效果显著优于对照组（p < 0.01），改善了 20%……',
        type: 'textarea',
        words: [15, 60],
        required: true,
        example: '实验结果表明，所提方法将运输损耗率降低了 17.3%，总成本降低了 12.8%，且差异具有统计显著性（p < 0.001）。',
      },
      {
        key: 'conclusion',
        label: '⑤ 结论 — 这项工作意味着什么？',
        hint: '用 1 句话总结你的研究贡献和现实意义。不要重复结果，而是说"这证明了……"、"这提示……"。',
        placeholder: '比如：这些发现表明……，为……提供了新的思路。',
        type: 'textarea',
        words: [10, 40],
        required: true,
        example: '研究结果证实了混合优化框架在解决农产品冷链物流多目标决策问题上的可行性和有效性。',
      },
    ],
  },

  introduction: {
    sectionKey: 'introduction',
    title: '引言',
    description: '引言就像讲故事——先让读者觉得"这个领域很重要"，然后告诉他"但还有问题没解决"，最后说"所以我来解决"。按下面 4 步填写就很自然。',
    fields: [
      {
        key: 'research_territory',
        label: '第 1 步：这个领域为什么重要？',
        hint: '介绍你的研究背景。用大家都能理解的语言说明这个领域为什么值得研究。可以引用一些数据或事实让论述更有说服力。',
        placeholder: '从大的背景开始写，然后逐渐聚焦到你的具体方向。比如：随着……的发展，……问题日益突出……',
        type: 'textarea',
        words: [40, 200],
        required: true,
        example: '随着全球人口增长和消费升级，农产品供应链的效率与可持续性成为各国关注的焦点。据联合国粮农组织估计，全球每年约有 14% 的粮食在收获后到零售前损失。在中国，仅果蔬品类的产后损耗率就高达 25%-30%，其中运输环节是损耗最集中的节点之一。优化物流路径规划被认为是降低损耗最直接的途径之一。',
      },
      {
        key: 'research_gap',
        label: '第 2 步：还有什么是没解决的？（最关键的一步）',
        hint: '指出已有研究的不足或空白。这是引言中最重要的段落——你要让读者觉得"确实，这个问题还没人解决好"。可以从方法局限、样本局限、场景局限等角度来写。',
        placeholder: '比如：尽管已有大量关于……的研究，但……方面仍存在不足/尚未得到充分关注……',
        type: 'textarea',
        words: [40, 200],
        required: true,
        example: '尽管已有研究在车辆路径规划方面取得了丰富成果，但大多数方法仅以运输成本为单一优化目标，忽略了农产品在运输过程中的品质衰减、碳排放约束以及路况动态变化等多重因素。传统的多目标进化算法虽然能给出较好的 Pareto 前沿，但无法实时适应路况变化；而单智能体强化学习方法虽然具有动态响应能力，却难以有效处理多个相互冲突的目标之间的权衡。',
      },
      {
        key: 'research_purpose',
        label: '第 3 步：本文要做什么？',
        hint: '明确提出你的研究目的。这是读者最关心的——"这篇论文到底要解决什么问题？"',
        placeholder: '比如：本文旨在……；本研究的目标是……；我们提出了一种……方法，以解决……',
        type: 'textarea',
        words: [25, 120],
        required: true,
        example: '针对上述不足，本文提出一种混合多目标深度强化学习框架，将进化算法的全局搜索能力与策略梯度方法的动态决策能力相结合，同时优化运输成本、损耗率和碳排放三个目标，并在真实物流场景数据上验证其有效性。',
      },
      {
        key: 'paper_structure',
        label: '第 4 步：论文结构概览（可选）',
        hint: '如果论文较长，可以在这里简要告诉读者后面的章节安排。短文可以不写这一步。',
        placeholder: '比如：本文其余部分安排如下：第 2 节介绍方法，第 3 节报告实验结果……',
        type: 'textarea',
        words: [0, 80],
        required: false,
        example: '本文其余部分安排如下：第 2 节阐述所提方法的设计思路与算法细节；第 3 节报告实验结果与对比分析；第 4 节讨论研究发现的意义与局限性；第 5 节总结全文。',
      },
    ],
  },

  methods: {
    sectionKey: 'methods',
    title: '研究方法',
    description: '方法部分的核心标准是：别人看完你的描述，能不能把研究重复一遍？所以越具体越好。对普通人来说，关键是把你做的每一步都说清楚。',
    fields: [
      {
        key: 'study_design',
        label: '① 研究设计 — 你用了什么类型的研究？',
        hint: '说明你采用的研究类型。是问卷调查？对照实验？计算模拟？田野调查？把大框架讲清楚。',
        placeholder: '比如：本研究采用问卷调查法/随机对照试验/计算实验设计，在……环境下进行。数据收集时间为……到……',
        type: 'textarea',
        words: [25, 150],
        required: true,
        example: '本研究采用计算实验设计。测试环境模拟了一个包含 50 个节点的真实物流网络，其中 1 个中心冷库和 49 个零售商分布在 200 km × 200 km 的服务区域内。所有实验在配备 Intel Xeon CPU 和 NVIDIA RTX 3080 GPU 的服务器上运行。',
      },
      {
        key: 'participants_or_materials',
        label: '② 研究对象 / 数据来源 — 你研究了什么？',
        hint: '如果是人的研究：写清楚有多少参与者、怎么招募的、有什么特征（年龄、性别等）。如果是数据/系统的研究：写清楚数据来源、规模、时间范围。',
        placeholder: '比如：共计 N 人参与本研究，其中男性占 XX%，平均年龄 XX 岁…… / 数据来源于 XX 数据库，包含 XX 条记录……',
        type: 'textarea',
        words: [30, 200],
        required: true,
        example: '实验数据来源于山东省寿光市（中国北方最大的蔬菜集散中心）2023-2024 年的真实物流运营记录，共计 10,000 条运输订单。每条订单包含出发地经纬度、目的地经纬度、货物类型、重量、要求温控区间、装车时间和规定送达时间窗口等信息。',
      },
      {
        key: 'procedure',
        label: '③ 实验流程 — 你具体做了什么？',
        hint: '按时间顺序描述研究步骤。像一个实验手册一样，一步一步写清楚。包括使用了什么工具、怎么测量的。',
        placeholder: '比如：首先……，然后……，最后……。XX 指标使用 XX 工具测量……',
        type: 'textarea',
        words: [30, 200],
        required: true,
        example: '实验流程如下：(1) 将 10,000 条订单按日期划分为 30 个独立的测试场景；(2) 对每个场景，分别运行所提方法和五种对比方法各 30 次；(3) 每次运行时记录最终运输总成本、货物损耗率和碳排放量三个指标；(4) 使用超体积指标(HV)、反世代距离(IGD)和散布度(Spread)三个指标评估算法质量；(5) 采用 Wilcoxon 符号秩检验（经 Bonferroni 校正）比较方法间的显著性差异。',
      },
      {
        key: 'statistical_analysis',
        label: '④ 分析方法 — 你用什么工具和统计方法？',
        hint: '说明用了什么软件、什么统计检验、显著性水平设多少。如果不知道怎么描述，可以参考下方的例句。',
        placeholder: '比如：所有数据分析使用 XX 软件（版本 X.X）完成。组间比较采用 XX 检验，显著性水平设为 α = 0.05……',
        type: 'textarea',
        words: [20, 150],
        required: true,
        example: '所有数据分析使用 Python 3.12 完成，其中进化算法基于 pymoo 库实现，强化学习基于 PyTorch 2.0 实现。统计检验采用 Wilcoxon 符号秩检验，显著性水平设定为 α = 0.05，多重比较采用 Bonferroni 校正。',
      },
      {
        key: 'ethics',
        label: '⑤ 其他说明（可选）',
        hint: '如果有伦理审批、利益冲突声明、数据可获取性说明等，写在这里。没有可以不填。',
        placeholder: '比如：本研究已获得 XX 伦理委员会批准（批号：XXX）…… / 本文所用数据和代码可在 XX 获取……',
        type: 'textarea',
        words: [0, 100],
        required: false,
        example: '本文所用测试数据集和源代码已上传至 GitHub (https://github.com/xxx)，可供后续研究复现和比较。',
      },
    ],
  },

  results: {
    sectionKey: 'results',
    title: '研究结果',
    description: '结果部分只摆事实，不做解读——解读留给"讨论"部分。把你的发现客观地报告出来，用数据和统计检验说话。',
    fields: [
      {
        key: 'descriptive_results',
        label: '① 基本数据描述 — 你的样本/数据长什么样？',
        hint: '报告描述性统计：均值、标准差、百分比等。让读者对数据全貌有一个基本了解。如果有表格的话，可以在这里提到。',
        placeholder: '比如：表 1 展示了参与者的基本特征。其中……的平均值为……，标准差为……',
        type: 'textarea',
        words: [25, 150],
        required: true,
        example: '表 1 总结了 30 个测试场景的基本特征。平均每场景包含 333 个配送订单（SD = 45），平均配送距离为 34.2 km（SD = 12.7），平均温控要求为 4.3°C（范围 2-8°C）。',
      },
      {
        key: 'inferential_results',
        label: '② 主要发现 — 你的核心结果是什么？',
        hint: '这是结果部分最重要的段落。报告你的核心发现，包括统计检验的结果。如果结果显著，给出检验统计量和 p 值。如果不显著，也要诚实报告。（提示：打开句型库有专门的"报告结果"句型模板）',
        placeholder: '比如：在……方面，实验组（M = XX, SD = XX）的表现显著优于对照组（M = XX, SD = XX），t(XX) = X.XX, p < 0.01……',
        type: 'textarea',
        words: [40, 300],
        required: true,
        example: '所提方法在所有三个评价维度上均优于最佳基线方法。在运输成本方面，所提方法的平均成本为 2,847.3 元（SD = 312.5），比 MOEA/D-DE 方法降低 12.8%；在损耗率方面，平均损耗率为 4.21%（SD = 0.83%），降低了 17.3%；在碳排放强度方面，平均为 18.7 kg CO₂/吨·公里（SD = 2.1），降低了 12.6%。三项指标的差异均达到统计显著水平（Wilcoxon 符号秩检验，p < 0.01，经 Bonferroni 校正后仍显著）。',
      },
      {
        key: 'additional_analyses',
        label: '③ 补充分析 — 还有什么值得一提的？（可选）',
        hint: '如果有分组分析、敏感性检验、意外发现等，写在这里。没有的话可以不填。',
        placeholder: '比如：进一步分析发现，XX 效应在……子群体中更为明显…… / 敏感性分析表明结果对……参数选择不敏感……',
        type: 'textarea',
        words: [0, 150],
        required: false,
        example: '消融实验表明，框架中的每个组件均有实质贡献：移除图注意力编码器导致超体积指标下降 8.2%，移除进化搜索模块导致下降 12.7%，移除约束修复算子导致 23.1% 的路径违反温控或载重约束。',
      },
    ],
  },

  discussion: {
    sectionKey: 'discussion',
    title: '讨论',
    description: '现在你可以"解读"结果了——你的结果意味着什么？和别人的研究比怎么样？有什么不足？按下面 5 步来写，自然会形成一篇完整的讨论。',
    fields: [
      {
        key: 'summary_of_findings',
        label: '第 1 步：简要回顾你的主要发现',
        hint: '用 2-3 句话总结最重要的结果。不要重复结果部分的所有数字——提炼出最核心的信息。',
        placeholder: '比如：本研究发现……。其中最重要的发现是……',
        type: 'textarea',
        words: [25, 100],
        required: true,
        example: '本研究发现，混合优化框架在所有三项评价指标上均一致优于单一方法。最重要的是，进化搜索与强化学习的组合产生了互补效应——进化算法提供了多样化的候选解，而强化学习则赋予了系统实时适应动态环境的能力。',
      },
      {
        key: 'comparison_with_literature',
        label: '第 2 步：和已有的研究对比',
        hint: '你的发现和前人研究一致吗？还是不同？为什么？至少讨论 2-3 项已有工作。这是展示你对领域熟悉度的段落。',
        placeholder: '比如：本研究发现的……与 XX（年份）的研究结果一致，他们同样发现……。但与 YY（年份）的结论不同，这可能是因为……',
        type: 'textarea',
        words: [60, 300],
        required: true,
        example: '本研究发现的"混合方法优于单一方法"的结论与 Li 等人(2022)在制造业调度领域的研究趋势一致，他们同样发现进化-强化混合框架带来了 10%-20% 的性能提升。但在具体机制上，本研究发现约束修复算子对性能的贡献（23.1% 路径满足约束）远超 Li 等人的报告（约 5%），这可能是因为冷链物流的约束条件（温控连续性、时间窗口）比制造业调度更为严格和复杂。',
      },
      {
        key: 'explanation',
        label: '第 3 步：为什么会有这样的结果？',
        hint: '解释你的发现背后的原因或机制。这是展示你思考深度的段落。可以提出合理的推测，但要说明"这需要进一步验证"。',
        placeholder: '比如：这一结果可能的原因是……。具体而言，……机制可能起到了关键作用……',
        type: 'textarea',
        words: [40, 200],
        required: true,
        example: '混合框架表现优异的原因可能有三方面：(1) 进化算法在每轮决策时提供了高质量的候选解池，避免了纯强化学习方法在稀疏奖励环境中常见的探索不足问题；(2) Pareto 引导的经验回放机制使策略网络能持续从最优折衷解中学习；(3) 冷链约束修复算子确保了候选解的可行性，避免了大量无效探索。',
      },
      {
        key: 'limitations',
        label: '第 4 步：诚实地承认不足之处',
        hint: '每项研究都有局限。诚实地说出来反而增加可信度。可以从样本量、方法局限、推广性等角度来写。至少写 2 条。',
        placeholder: '比如：本研究存在以下局限：第一，……。第二，……。这些因素可能限制了研究结论在……方面的推广。',
        type: 'textarea',
        words: [30, 200],
        required: true,
        example: '本研究存在以下局限。第一，测试数据仅来源于单一地理区域（山东省寿光市），结论在其他农产品产区（如南方热带水果产区）的适用性需要进一步验证。第二，实验假设了路况数据的实时可获取性，但这一基础设施在偏远农村地区尚未普及。第三，模型未考虑极端天气事件（台风、暴雪等）对物流网络的全面中断效应。',
      },
      {
        key: 'implications',
        label: '第 5 步：你的研究有什么意义？未来该怎么继续？',
        hint: '对实际工作有什么启示？理论上有什么贡献？下一步研究该做什么？给出具体、可操作的建议。',
        placeholder: '比如：从实践角度看，本研究的发现提示……。未来研究应进一步探索……',
        type: 'textarea',
        words: [25, 150],
        required: true,
        example: '从实践角度看，本研究为物流企业引入智能调度系统提供了实证依据。对于年吞吐量百万吨级的物流枢纽，12.8% 的成本降低意味着可观的经济效益。未来研究应进一步探索多式联运（公路+铁路+短途空运）场景下的优化，以及联邦学习框架下多家物流企业间的隐私保护协作。',
      },
    ],
  },

  conclusion: {
    sectionKey: 'conclusion',
    title: '结论',
    description: '结论是全文的收官——简洁有力地告诉读者"这篇论文做了什么、贡献了什么、未来该做什么"。不要引入新信息。',
    fields: [
      {
        key: 'core_findings',
        label: '① 做了什找么，到了什么？',
        hint: '用 1-2 句话把全文最核心的结论说出来。这是读者离开前最后记住的东西。',
        placeholder: '比如：本文通过……研究/实验，发现……。这一发现表明……',
        type: 'textarea',
        words: [15, 60],
        required: true,
        example: '本文提出了一种混合多目标深度强化学习框架用于农产品冷链物流路径规划，通过真实物流数据的实验验证，证明该框架能同时显著降低运输成本、损耗率和碳排放。',
      },
      {
        key: 'contributions',
        label: '② 你对这个领域的贡献是什么？',
        hint: '总结你为这个研究领域带来了什么新东西。新方法？新发现？新数据？新视角？实事求是地说。',
        placeholder: '比如：本文的主要贡献包括：（1）提出了……；（2）验证了……；（3）为……提供了实证依据……',
        type: 'textarea',
        words: [15, 80],
        required: true,
        example: '本文的主要贡献包括：(1) 提出了一种 Pareto 引导的经验回放机制，为进化算法与强化学习的深度融合提供了新思路；(2) 基于中国最大蔬菜物流枢纽的真实数据，验证了混合优化框架在实际场景中的有效性；(3) 为冷链物流企业引入智能调度提供了可以直接参考的实证依据。',
      },
      {
        key: 'future_work',
        label: '③ 下一步该做什么？（可选）',
        hint: '给未来研究者 1-2 条具体建议。不要写"需要更多研究"这种空话——说具体要研究什么。',
        placeholder: '比如：未来研究可考虑…… / ……是值得探索的方向……',
        type: 'textarea',
        words: [0, 60],
        required: false,
        example: '未来研究可考虑将本文框架扩展至多式联运场景，并探索联邦学习架构下多方数据共享而不泄露商业隐私的可能性。',
      },
    ],
  },
};

export function getDefaultFieldValues(sectionKey: string): FieldValues {
  const schema = SECTION_SCHEMAS[sectionKey];
  if (!schema) return {};
  const v: FieldValues = {};
  for (const f of schema.fields) v[f.key] = '';
  return v;
}
