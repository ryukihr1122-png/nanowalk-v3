/**
 * モンスター画像の静的マップ（001〜100）
 * ファイルは assets/monsters_clean/monster_XXX.png
 * ※ 023, 030, 032-033, 041-043, 045-057, 059, 061-066, 077 は仮画像（未実装）
 */

const MONSTER_IMAGES: Record<number, any> = {
  1:   require("../../assets/monsters_clean/monster_001.png"),
  2:   require("../../assets/monsters_clean/monster_002.png"),
  3:   require("../../assets/monsters_clean/monster_003.png"),
  4:   require("../../assets/monsters_clean/monster_004.png"),
  5:   require("../../assets/monsters_clean/monster_005.png"),
  6:   require("../../assets/monsters_clean/monster_006.png"),
  7:   require("../../assets/monsters_clean/monster_007.png"),
  8:   require("../../assets/monsters_clean/monster_008.png"),
  9:   require("../../assets/monsters_clean/monster_009.png"),
  10:  require("../../assets/monsters_clean/monster_010.png"),
  11:  require("../../assets/monsters_clean/monster_011.png"),
  12:  require("../../assets/monsters_clean/monster_012.png"),
  13:  require("../../assets/monsters_clean/monster_013.png"),
  14:  require("../../assets/monsters_clean/monster_014.png"),
  15:  require("../../assets/monsters_clean/monster_015.png"),
  16:  require("../../assets/monsters_clean/monster_016.png"),
  17:  require("../../assets/monsters_clean/monster_017.png"),
  18:  require("../../assets/monsters_clean/monster_018.png"),
  19:  require("../../assets/monsters_clean/monster_019.png"),
  20:  require("../../assets/monsters_clean/monster_020.png"),
  21:  require("../../assets/monsters_clean/monster_021.png"),
  22:  require("../../assets/monsters_clean/monster_022.png"),
  23:  require("../../assets/monsters_clean/monster_023.png"), // 仮
  24:  require("../../assets/monsters_clean/monster_024.png"),
  25:  require("../../assets/monsters_clean/monster_025.png"),
  26:  require("../../assets/monsters_clean/monster_026.png"),
  27:  require("../../assets/monsters_clean/monster_027.png"),
  28:  require("../../assets/monsters_clean/monster_028.png"),
  29:  require("../../assets/monsters_clean/monster_029.png"),
  30:  require("../../assets/monsters_clean/monster_030.png"), // 仮
  31:  require("../../assets/monsters_clean/monster_031.png"),
  32:  require("../../assets/monsters_clean/monster_032.png"), // 仮
  33:  require("../../assets/monsters_clean/monster_033.png"), // 仮
  34:  require("../../assets/monsters_clean/monster_034.png"),
  35:  require("../../assets/monsters_clean/monster_035.png"),
  36:  require("../../assets/monsters_clean/monster_036.png"),
  37:  require("../../assets/monsters_clean/monster_037.png"),
  38:  require("../../assets/monsters_clean/monster_038.png"),
  39:  require("../../assets/monsters_clean/monster_039.png"),
  40:  require("../../assets/monsters_clean/monster_040.png"),
  41:  require("../../assets/monsters_clean/monster_041.png"), // 仮
  42:  require("../../assets/monsters_clean/monster_042.png"), // 仮
  43:  require("../../assets/monsters_clean/monster_043.png"), // 仮
  44:  require("../../assets/monsters_clean/monster_044.png"),
  45:  require("../../assets/monsters_clean/monster_045.png"), // 仮
  46:  require("../../assets/monsters_clean/monster_046.png"), // 仮
  47:  require("../../assets/monsters_clean/monster_047.png"), // 仮
  48:  require("../../assets/monsters_clean/monster_048.png"), // 仮
  49:  require("../../assets/monsters_clean/monster_049.png"), // 仮
  50:  require("../../assets/monsters_clean/monster_050.png"), // 仮
  51:  require("../../assets/monsters_clean/monster_051.png"), // 仮
  52:  require("../../assets/monsters_clean/monster_052.png"), // 仮
  53:  require("../../assets/monsters_clean/monster_053.png"), // 仮
  54:  require("../../assets/monsters_clean/monster_054.png"), // 仮
  55:  require("../../assets/monsters_clean/monster_055.png"), // 仮
  56:  require("../../assets/monsters_clean/monster_056.png"), // 仮
  57:  require("../../assets/monsters_clean/monster_057.png"), // 仮
  58:  require("../../assets/monsters_clean/monster_058.png"),
  59:  require("../../assets/monsters_clean/monster_059.png"), // 仮
  60:  require("../../assets/monsters_clean/monster_060.png"),
  61:  require("../../assets/monsters_clean/monster_061.png"), // 仮
  62:  require("../../assets/monsters_clean/monster_062.png"), // 仮
  63:  require("../../assets/monsters_clean/monster_063.png"), // 仮
  64:  require("../../assets/monsters_clean/monster_064.png"), // 仮
  65:  require("../../assets/monsters_clean/monster_065.png"), // 仮
  66:  require("../../assets/monsters_clean/monster_066.png"), // 仮
  67:  require("../../assets/monsters_clean/monster_067.png"),
  68:  require("../../assets/monsters_clean/monster_068.png"),
  69:  require("../../assets/monsters_clean/monster_069.png"),
  70:  require("../../assets/monsters_clean/monster_070.png"),
  71:  require("../../assets/monsters_clean/monster_071.png"),
  72:  require("../../assets/monsters_clean/monster_072.png"),
  73:  require("../../assets/monsters_clean/monster_073.png"),
  74:  require("../../assets/monsters_clean/monster_074.png"),
  75:  require("../../assets/monsters_clean/monster_075.png"),
  76:  require("../../assets/monsters_clean/monster_076.png"),
  77:  require("../../assets/monsters_clean/monster_077.png"), // 仮
  78:  require("../../assets/monsters_clean/monster_078.png"),
  79:  require("../../assets/monsters_clean/monster_079.png"),
  80:  require("../../assets/monsters_clean/monster_080.png"),
  81:  require("../../assets/monsters_clean/monster_081.png"),
  82:  require("../../assets/monsters_clean/monster_082.png"),
  83:  require("../../assets/monsters_clean/monster_083.png"),
  84:  require("../../assets/monsters_clean/monster_084.png"),
  85:  require("../../assets/monsters_clean/monster_085.png"),
  86:  require("../../assets/monsters_clean/monster_086.png"),
  87:  require("../../assets/monsters_clean/monster_087.png"),
  88:  require("../../assets/monsters_clean/monster_088.png"),
  89:  require("../../assets/monsters_clean/monster_089.png"),
  90:  require("../../assets/monsters_clean/monster_090.png"),
  91:  require("../../assets/monsters_clean/monster_091.png"),
  92:  require("../../assets/monsters_clean/monster_092.png"),
  93:  require("../../assets/monsters_clean/monster_093.png"),
  94:  require("../../assets/monsters_clean/monster_094.png"),
  95:  require("../../assets/monsters_clean/monster_095.png"),
  96:  require("../../assets/monsters_clean/monster_096.png"),
  97:  require("../../assets/monsters_clean/monster_097.png"),
  98:  require("../../assets/monsters_clean/monster_098.png"),
  99:  require("../../assets/monsters_clean/monster_099.png"),
  100: require("../../assets/monsters_clean/monster_100.png"),
};

export function getMonsterImage(id: number): any {
  return MONSTER_IMAGES[id] ?? null;
}
