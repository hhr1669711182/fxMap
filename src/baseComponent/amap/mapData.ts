export const zhxfdzXYList = [
    // ==================== 支队/大队级单位 ====================
    {
        lng: 113.51349,   // 约113°30'49"E
        lat: 22.27929,    // 约22°16'45"N
        title: "珠海市消防救援支队",
        address: "珠海市香洲区梅华西路2302号",
        phone: "0756-8619824 / 0756-8619844"
    },
    {
        lng: 113.54537,   // 约113.54537°E
        lat: 22.27449,    // 约22.27449°N
        title: "珠海市香洲区消防救援大队",
        address: "珠海市香洲区人民东路230号",
        phone: "0756-2219975"
    },
    {
        lng: 113.6121896,
        lat: 22.3641095,
        title: "珠海（国家）高新技术产业开发区消防救援大队",
        address: "珠海市香洲区港乐路10号",
        phone: "0756-3319641"
    },
    {
        lng: 113.5333491,
        lat: 22.1312261,
        title: "珠海市横琴新区消防救援大队",
        address: "珠海市横琴粤澳深度合作区环岛北路1105号（石博园消防救援站）",
        phone: "0756-8906119"
    },

    // ==================== 消防救援站/中队 ====================
    {
        lng: 113.55449,   // 约113.55449°E
        lat: 22.21756,    // 约22.21756°N
        title: "拱北消防救援站",
        address: "珠海市香洲区拱北桂花南路34号",
        phone: "0756-2219835"
    },
    {
        lng: 113.58374,   // 约113.58374°E
        lat: 22.25268,    // 约22.25268°N
        title: "吉大消防救援站",
        address: "香洲区吉大情侣南路497号",
        phone: "0756-3354207"
    },
    {
        lng: 113.488863,
        lat: 22.224864,
        title: "南屏消防救援站",
        address: "香洲区南屏科技园屏北一路16-2号",
        phone: "0756-2219935"
    },
    {
        lng: 113.5330,
        lat: 22.2590,
        title: "前山消防救援站 / 前山消防中队",
        address: "珠海市香洲区前山白云路300号",
        phone: "0756-8802001"
    },
    {
        lng: 113.5957,
        lat: 22.36370,
        title: "唐家消防救援站 / 唐家消防中队",
        address: "珠海市高新区唐家湾镇港乐路10号",
        phone: "0756-8802002"
    },
    {
        lng: 113.5342,
        lat: 22.1260,
        title: "横琴香江路消防救援站",
        address: "横琴粤澳深度合作区香江路219号",
        phone: "0756-8916119"
    },
    {
        lng: 113.5689,
        lat: 22.2741,
        title: "人民东路消防救援站",
        address: "珠海市香洲区人民东路",
        phone: "0756-8802003"
    },
    {
        lng: 113.5749948,
        lat: 22.3134811,
        title: "香湾消防救援站",
        address: "香洲区香湾街道",
        phone: "0756-8802004"
    },
    // {
    //     lng: 113.5515,
    //     lat: 22.2050,
    //     title: "港珠澳大桥专职消防救援站",
    //     address: "港珠澳大桥口岸人工岛",
    //     phone: "0756-8802005"
    // },
    {
        lng: 113.5336,
        lat: 22.1420,
        title: "石博园消防救援站",
        address: "珠海市横琴粤澳深度合作区环岛北路1105号",
        phone: "0756-8802006"
    },

    // ==================== 小型消防站 / 微型消防站 ====================
    {
        lng: 113.5310,
        lat: 22.2370,
        title: "湾仔街道小型消防站",
        address: "珠海市香洲区花地路1号",
        phone: "0756-8802101"
    },
    {
        lng: 113.5450,
        lat: 22.2540,
        title: "翠微小型消防站",
        address: "翠前北路与鸿鹄街交叉口西150米",
        phone: "0756-8802102"
    },
    {
        lng: 113.5650,
        lat: 22.2890,
        title: "梅华街道南虹社区微型消防站",
        address: "珠海市香洲区梅华街道南虹社区",
        phone: "0756-8802103"
    },
    {
        lng: 113.5825,
        lat: 22.2550,
        title: "吉大街道竹苑社区微型消防站",
        address: "广东省珠海市香洲区龙兴街2号",
        phone: "0756-8802104"
    },
    {
        lng: 113.5797,
        lat: 22.26909,
        title: "香湾街道海霞社区微型消防站",
        address: "广东省珠海市香洲区海城路21号",
        phone: "0756-8802105"
    },
    {
        lng: 113.5540,
        lat: 22.2240,
        title: "尚都时尚百货微型消防站",
        address: "珠海市香洲区凤凰南路1168号尚都时尚百货F1",
        phone: "0756-8802106"
    },
    {
        lng: 113.5690,
        lat: 22.2770,
        title: "寰庭商旅酒店微型消防站",
        address: "广东省珠海市香洲区狮山街道狮山路111号",
        phone: "0756-8802107"
    }
];

export type ZhxfStationOSM = {
  lng: number;
  lat: number;
  title: string;
  osmType: "node" | "way" | "relation";
  osmId: number;
  operator?: string;
  source: "OpenStreetMap";
};

export const zhxfdzXYListOSM: ZhxfStationOSM[] = [
  {
    osmType: "way",
    osmId: 1272026749,
    lng: 113.543749,
    lat: 22.2210914,
    title: "拱北消防中队",
    source: "OpenStreetMap",
  },
  {
    osmType: "way",
    osmId: 1030840558,
    lng: 113.5333491,
    lat: 22.1312261,
    title: "横琴消防",
    source: "OpenStreetMap",
  },
  {
    osmType: "way",
    osmId: 1374656368,
    lng: 113.5749948,
    lat: 22.3134811,
    title: "香湾社区小型消防站",
    source: "OpenStreetMap",
  },
  {
    osmType: "node",
    osmId: 12189672515,
    lng: 113.5150518,
    lat: 22.2883745,
    title: "消防站",
    source: "OpenStreetMap",
  },
  {
    osmType: "node",
    osmId: 12762188833,
    lng: 113.515333,
    lat: 22.3517269,
    title: "消防站",
    source: "OpenStreetMap",
  },
  {
    osmType: "node",
    osmId: 13608932391,
    lng: 113.5957155,
    lat: 22.32222,
    title: "消防站",
    source: "OpenStreetMap",
  },
  {
    osmType: "way",
    osmId: 548666411,
    lng: 113.5713124,
    lat: 22.212183,
    title: "消防站",
    source: "OpenStreetMap",
  },
  {
    osmType: "way",
    osmId: 1346191980,
    lng: 113.5836049,
    lat: 22.2456103,
    title: "消防站",
    source: "OpenStreetMap",
  },
  {
    osmType: "relation",
    osmId: 18299401,
    lng: 113.482683,
    lat: 22.1781229,
    title: "珠海市保税区南湾消防中队",
    source: "OpenStreetMap",
  },
  {
    osmType: "way",
    osmId: 1229977569,
    lng: 113.5614217,
    lat: 22.2745056,
    title: "珠海市公安消防局香洲大队",
    source: "OpenStreetMap",
  },
  {
    osmType: "way",
    osmId: 1230140965,
    lng: 113.5135442,
    lat: 22.2793674,
    title: "珠海市消防救援支队",
    source: "OpenStreetMap",
  },
  {
    osmType: "node",
    osmId: 10600254668,
    lng: 113.6121896,
    lat: 22.3641095,
    title: "珠海市应急救援中心三大队",
    operator: "应急管理部消防救援局",
    source: "OpenStreetMap",
  },
];
