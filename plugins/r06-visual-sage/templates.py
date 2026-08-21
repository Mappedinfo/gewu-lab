"""Task-template registry.

A Template is one row in the visual task menu: a typed parameter schema plus a
code generator that turns form values into executable Python/SymPy. The code
shown to the user is *exactly* the code executed -- no hidden transformations,
no stubs.

Templates whose `needs_engine == "gap"` cannot run on the SymPy engine; the
runner returns a clear explanation instead of faking a result.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Literal

ParamType = Literal["int", "expr", "enum", "string", "matrix", "intlist"]


@dataclass
class Param:
    name: str
    label: str
    type: ParamType
    default: Any = ""
    options: list[str] = field(default_factory=list)
    hint: str = ""

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "label": self.label,
            "type": self.type,
            "default": self.default,
            "options": self.options,
            "hint": self.hint,
        }


@dataclass
class Template:
    id: str
    name: str
    category: str
    description: str
    params: list[Param]
    generate: Callable[[dict[str, Any]], str]
    needs_engine: str = "sympy"
    note: str = ""

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "params": [p.to_dict() for p in self.params],
            "needs_engine": self.needs_engine,
            "note": self.note,
        }


# ---- code-gen helpers --------------------------------------------------------

def _py(value: Any) -> str:
    """Render a Python literal for embedding in generated code."""
    if isinstance(value, str):
        return repr(value)
    return repr(value)


# ============================================================================
#  数论  Number Theory
# ============================================================================

T_NUM_THEORY = [

Template(
    id="nt_factor",
    name="整数质因数分解",
    category="数论",
    description="对整数 n 做质因数分解，给出 factorint 字典与可视化分解式。",
    params=[
        Param("n", "整数 n", "int", default=360, hint="0 < n < 10^30"),
    ],
    generate=lambda p: f"""\
n = {_py(p['n'])}
show(n, label='n')
show(factorint(n), label='factorint(n)  ->  {{质因子: 指数}}')
show(factorint(n, visual=True), label='可视化分解式')
show(divisor_count(n), label='因数个数 τ(n)')
show(divisor_sigma(n), label='因数之和 σ(n)')
""",
),

Template(
    id="nt_isprime",
    name="素数判定 / 素性测试",
    category="数论",
    description="判定 n 是否为素数，并给出下一个 / 上一个素数。",
    params=[Param("n", "整数 n", "int", default=1000003)],
    generate=lambda p: f"""\
n = {_py(p['n'])}
show(isprime(n), label='isprime(n)')
show(nextprime(n), label='nextprime(n)')
show(prevprime(n), label='prevprime(n)')
""",
),

Template(
    id="nt_prime_range",
    name="区间内的素数",
    category="数论",
    description="列出闭区间 [a, b] 内的所有素数（上限 1000 个，避免刷屏）。",
    params=[
        Param("a", "起点 a", "int", default=1),
        Param("b", "终点 b", "int", default=100),
    ],
    generate=lambda p: f"""\
a, b = {_py(p['a'])}, {_py(p['b'])}
ps = list(primerange(a, b + 1))
show(len(ps), label='区间内素数个数')
show(ps[:1000], label='primerange(a, b)')
""",
),

Template(
    id="nt_crt",
    name="中国剩余定理 (CRT)",
    category="数论",
    description="求解同余方程组 x ≡ rᵢ (mod mᵢ)。两个列表用逗号分隔，长度需相同。",
    params=[
        Param("r", "余数 rᵢ", "intlist", default="2,3,2", hint="如 2,3,2"),
        Param("m", "模数 mᵢ", "intlist", default="3,5,7", hint="如 3,5,7（需两两互素）"),
    ],
    generate=lambda p: f"""\
R = _parse_int_list({_py(p['r'])})
M = _parse_int_list({_py(p['m'])})
show(R, label='余数 r')
show(M, label='模数 m')
res, mod = crt(M, R)
show(res, label='crt 最小非负解 x')
show(mod, label='模 ∏mᵢ')
show(res % mod, label='x (mod ∏mᵢ)')
""",
),

Template(
    id="nt_modexp",
    name="模幂 / 快速幂",
    category="数论",
    description="计算 base^exp mod m（快速幂）。",
    params=[
        Param("base", "底数", "int", default=7),
        Param("exp", "指数", "int", default=256),
        Param("m", "模数 m", "int", default=1009),
    ],
    generate=lambda p: f"""\
b, e, m = {_py(p['base'])}, {_py(p['exp'])}, {_py(p['m'])}
show(pow(b, e, m), label=f'{{b}}^{{e}} mod {{m}}')
""",
),

Template(
    id="nt_phi",
    name="欧拉函数 φ(n)",
    category="数论",
    description="计算欧拉函数 φ(n)（不超过 n 且与 n 互素的正整数个数）。",
    params=[Param("n", "整数 n", "int", default=100)],
    generate=lambda p: f"""\
n = {_py(p['n'])}
show(totient(n), label='φ(n)')
""",
),

Template(
    id="nt_cunningham",
    name="Cunningham 分解 p^n ± 1",
    category="数论",
    description="对 p^n + 1 与 p^n - 1 做质因数分解（呼应 Magma 概览中的经典算例）。",
    params=[
        Param("p", "素数 p", "int", default=2),
        Param("n", "指数 n", "int", default=64),
    ],
    generate=lambda p: f"""\
p, n = {_py(p['p'])}, {_py(p['n'])}
show(factorint(p**n + 1), label=f'factorint({{p}}^{{n}} + 1)')
show(factorint(p**n - 1), label=f'factorint({{p}}^{{n}} - 1)')
""",
),
]


# ============================================================================
#  群论  Group Theory  (via sympy.combinatorics.PermutationGroup)
# ============================================================================

_PERM_FAMILIES = {
    "SymmetricGroup": "对称群 S_n",
    "AlternatingGroup": "交错群 A_n",
    "DihedralGroup": "二面体群 D_n",
    "CyclicGroup": "循环群 C_n",
}


def _build_perm_group(family: str, n: int) -> str:
    return f"{family}({n})"


T_GROUPS = [

Template(
    id="grp_overview",
    name="有限群基本性质",
    category="群论",
    description="构造对称群 / 交错群 / 二面体群 / 循环群，给出阶、交换性、可解性、循环性等。",
    params=[
        Param("family", "群族", "enum", default="SymmetricGroup",
              options=list(_PERM_FAMILIES.keys())),
        Param("n", "参数 n", "int", default=5),
    ],
    generate=lambda p: f"""\
from sympy.combinatorics.named_groups import SymmetricGroup, AlternatingGroup, DihedralGroup, CyclicGroup
G = {_build_perm_group(p['family'], p['n'])}
show(G, label='G')
show(G.order(), label='阶 |G|')
show(G.degree, label='次数 degree')
show(G.is_abelian, label='是否交换')
show(G.is_cyclic, label='是否循环')
show(G.is_solvable, label='是否可解')
show(G.is_nilpotent, label='是否幂零')
show(G.generators, label='生成元')
""",
),

Template(
    id="grp_center_derived",
    name="中心 / 导出群 / 换位子",
    category="群论",
    description="计算群的中心 Z(G)、导出群 G' 与导出列。",
    params=[
        Param("family", "群族", "enum", default="SymmetricGroup",
              options=list(_PERM_FAMILIES.keys())),
        Param("n", "参数 n", "int", default=5),
    ],
    generate=lambda p: f"""\
from sympy.combinatorics.named_groups import SymmetricGroup, AlternatingGroup, DihedralGroup, CyclicGroup
G = {_build_perm_group(p['family'], p['n'])}
show(G.center(), label='中心 Z(G)')
show(G.derived_subgroup(), label="导出群 G' (换位子群)")
show(G.derived_series(), label='导出列 derived_series')
show(G.lower_central_series(), label='下中心列')
""",
),

Template(
    id="grp_sylow",
    name="Sylow p-子群",
    category="群论",
    description="构造 G 的 Sylow p-子群，给出阶、是否正规、生成元。",
    params=[
        Param("family", "群族", "enum", default="SymmetricGroup",
              options=list(_PERM_FAMILIES.keys())),
        Param("n", "参数 n", "int", default=4),
        Param("p", "素数 p", "int", default=2),
    ],
    generate=lambda p: f"""\
from sympy.combinatorics.named_groups import SymmetricGroup, AlternatingGroup, DihedralGroup, CyclicGroup
G = {_build_perm_group(p['family'], p['n'])}
q = {_py(p['p'])}
S = G.sylow_subgroup(q)
show(G, label='G')
show(G.order(), label='|G|')
show(S, label=f'Sylow {{q}}-子群')
show(S.order(), label='|S| = p^k')
show(S.is_normal(G), label='S 是否正规')
show(S.generators, label='生成元')
""",
),

Template(
    id="grp_conjugacy_classes",
    name="共轭类与类方程",
    category="群论",
    description="列出 G 的共轭类大小，给出类方程 |G| = Σ |Cᵢ|。",
    params=[
        Param("family", "群族", "enum", default="SymmetricGroup",
              options=list(_PERM_FAMILIES.keys())),
        Param("n", "参数 n", "int", default=4),
    ],
    generate=lambda p: f"""\
from sympy.combinatorics.named_groups import SymmetricGroup, AlternatingGroup, DihedralGroup, CyclicGroup
G = {_build_perm_group(p['family'], p['n'])}
cc = G.conjugacy_classes()
sizes = [len(c) for c in cc]
show(G, label='G')
show(len(cc), label='共轭类个数')
show(sizes, label='各类大小')
print('类方程:  |G| =', G.order(), '=', ' + '.join(str(s) for s in sizes))
""",
),

Template(
    id="grp_composition_series",
    name="合成列 / 可解性",
    category="群论",
    description="给出 G 的合成列，从而判断 G 是否可解。",
    params=[
        Param("family", "群族", "enum", default="SymmetricGroup",
              options=list(_PERM_FAMILIES.keys())),
        Param("n", "参数 n", "int", default=5),
    ],
    generate=lambda p: f"""\
from sympy.combinatorics.named_groups import SymmetricGroup, AlternatingGroup, DihedralGroup, CyclicGroup
G = {_build_perm_group(p['family'], p['n'])}
try:
    cs = G.composition_series()
    show(len(cs) - 1, label='合成列长度')
    show([H.order() for H in cs], label='合成列各项的阶')
    show([H.order() // cs[i+1].order() for i, H in enumerate(cs[:-1])], label='相邻项的指数（应为素数）')
except NotImplementedError:
    show(G.is_solvable, label='G 是否可解')
    print('注：sympy 的 composition_series 仅对可解群实现；当前 G 不可解。')
""",
),

Template(
    id="grp_character_table",
    name="有限群特征标表",
    category="群论",
    description="计算 G 的不可约特征标表。这是 GAP/SageMath 的强项，SymPy 不支持。",
    params=[
        Param("family", "群族", "enum", default="SymmetricGroup",
              options=list(_PERM_FAMILIES.keys())),
        Param("n", "参数 n", "int", default=5),
    ],
    needs_engine="gap",
    note="依赖 GAP 引擎（SageMath 内置）。SymPy 引擎无法计算，请接入 SageMath/GAP 后端。",
    generate=lambda p: f"""\
# Target SageMath/GAP code (not executed by SymPy engine):
# G := SymmetricGroup({_py(p['n'])});
# Display(CharacterTable(G));
pass
""",
),
]


# ============================================================================
#  环与交换代数  Commutative Algebra
# ============================================================================

T_COMM_ALG = [

Template(
    id="ca_expand_simplify",
    name="展开 / 化简 / 因式分解",
    category="交换代数",
    description="对符号表达式做 expand / simplify / factor。变量用 x, y, z, t。",
    params=[
        Param("op", "操作", "enum", default="expand", options=["expand", "simplify", "factor"]),
        Param("expr", "表达式", "expr", default="(x+y)**6"),
    ],
    generate=lambda p: f"""\
expr = sympify({_py(p['expr'])})
show(expr, label='输入')
op = {_py(p['op'])}
show(getattr(expr, op)() if op != 'simplify' else simplify(expr), label=op)
""",
),

Template(
    id="ca_poly_factor",
    name="多项式因式分解",
    category="交换代数",
    description="在指定变量上对多项式做因式分解。",
    params=[
        Param("expr", "多项式", "expr", default="x**6 - 1"),
        Param("var", "主变量", "string", default="x"),
    ],
    generate=lambda p: f"""\
expr = sympify({_py(p['expr'])})
show(expr, label='输入')
show(factor(expr, domain='ZZ'), label='factor (over ZZ)')
""",
),

Template(
    id="ca_groebner",
    name="Gröbner 基",
    category="交换代数",
    description="计算理想 <f₁,…,fₖ> 在给定单项式序下的 Gröbner 基。",
    params=[
        Param("polys", "多项式列表", "string", default="x**2 + y**2, x*y - 1",
              hint="英文逗号分隔"),
        Param("vars", "变量", "string", default="x,y", hint="英文逗号分隔"),
        Param("order", "单项式序", "enum", default="grevlex",
              options=["lex", "grevlex", "grlex"]),
    ],
    generate=lambda p: f"""\
ps = [sympify(s) for s in {_py(p['polys'])}.split(',')]
vs = symbols({_py(p['vars'])})
if not isinstance(vs, tuple):
    vs = (vs,)
order = {_py(p['order'])}
gb = groebner(ps, *vs, order=order)
show(list(gb), label=f'Gröbner 基 (order={{order}})')
show(gb.exprs, label='generator expressions')
""",
),

Template(
    id="ca_solve_eq",
    name="解方程 / 方程组",
    category="交换代数",
    description="求解方程（组），返回符号解。",
    params=[
        Param("eq", "方程（=0 形式）", "expr", default="x**3 - 2*x + 1"),
        Param("var", "求解变量", "string", default="x"),
    ],
    generate=lambda p: f"""\
eq = sympify({_py(p['eq'])})
v = Symbol({_py(p['var'])})
show(eq, label='方程 = 0')
show(solve(eq, v), label=f'解集 solve(eq, {{v}})')
""",
),
]


# ============================================================================
#  线性代数  Linear Algebra
# ============================================================================

T_LIN_ALG = [

Template(
    id="la_matrix_info",
    name="矩阵基本信息",
    category="线性代数",
    description="给出矩阵的形状、秩、行列式、迹、特征多项式、特征值。",
    params=[
        Param("mat", "矩阵（行用 ; 分隔）", "matrix",
              default="1 2 3; 4 5 6; 7 8 10",
              hint="如 1 2 3; 4 5 6; 7 8 10"),
    ],
    generate=lambda p: f"""\
A = _parse_matrix({_py(p['mat'])})
show(A, label='A')
show(A.shape, label='shape')
show(A.rank(), label='rank')
show(A.det(), label='det')
show(A.trace(), label='trace')
show(A.charpoly(), label='特征多项式 charpoly')
show(A.eigenvals(), label='特征值 eigenvals')
""",
),

Template(
    id="la_rref",
    name="行最简形 (RREF) / 求逆",
    category="线性代数",
    description="计算行最简形与（若可逆）逆矩阵。",
    params=[
        Param("mat", "矩阵", "matrix", default="1 2; 3 4"),
    ],
    generate=lambda p: f"""\
A = _parse_matrix({_py(p['mat'])})
rref, pivots = A.rref()
show(rref, label='RREF')
show(pivots, label='主元列')
if A.is_square and A.det() != 0:
    show(A.inv(), label='A⁻¹')
else:
    print('A 不可逆，跳过求逆')
""",
),

Template(
    id="la_gauss_solve",
    name="解线性方程组 Ax = b",
    category="线性代数",
    description="求解 Ax = b；列出通解（含自由变量）。",
    params=[
        Param("mat", "系数矩阵 A", "matrix", default="1 1 1; 0 1 2; 1 0 -1"),
        Param("b", "右端 b（; 分隔列）", "matrix", default="6; 4; 2"),
    ],
    generate=lambda p: f"""\
A = _parse_matrix({_py(p['mat'])})
b = _parse_matrix({_py(p['b'])})
# linsolve expects (system, *symbols)
cols = A.shape[1]
syms = symbols('x0:%d' % cols)
from sympy import linsolve
ls = linsolve((A, b), syms)
show(A, label='A')
show(b, label='b')
show(ls, label='解集 linsolve')
""",
),
]


# ============================================================================
#  格  Lattices  (needs GAP/Sage for full power)
# ============================================================================

T_LATTICES = [

Template(
    id="lat_lll",
    name="LLL 格规约",
    category="格",
    description="对整矩阵做 LLL 规约，求短向量。依赖 SageMath/GAP。",
    params=[
        Param("mat", "整数矩阵", "matrix", default="1 2 3; 4 5 6; 7 8 10"),
    ],
    needs_engine="gap",
    note="依赖 SageMath（Matrix(...).LLL()）。SymPy 引擎无 LLL 实现。",
    generate=lambda p: f"""\
# Target SageMath code (not executed by SymPy engine):
# M = Matrix(ZZ, {_py(p['mat'])})
# show(M.LLL())
pass
""",
),
]


ALL_TEMPLATES: list[Template] = (
    T_NUM_THEORY + T_GROUPS + T_COMM_ALG + T_LIN_ALG + T_LATTICES
)

_BY_ID = {t.id: t for t in ALL_TEMPLATES}


def all_templates() -> list[Template]:
    return ALL_TEMPLATES


def get_template(template_id: str) -> Template | None:
    return _BY_ID.get(template_id)


def coerce_params(template: Template, raw: dict[str, Any]) -> dict[str, Any]:
    """Coerce raw form strings to typed values according to the schema."""
    out: dict[str, Any] = {}
    for p in template.params:
        v = raw.get(p.name, p.default)
        if p.type == "int":
            try:
                out[p.name] = int(str(v).strip())
            except (ValueError, TypeError):
                out[p.name] = p.default
        elif p.type in ("expr", "string", "matrix", "intlist"):
            out[p.name] = str(v)
        elif p.type == "enum":
            s = str(v)
            out[p.name] = s if s in p.options else p.default
        else:
            out[p.name] = v
    return out


# ============================================================================
#  Pyodide (browser) runtime — keeps templates.py the single source of truth.
#  These helpers are called from JS when the site runs as a pure static page.
# ============================================================================

ENGINE_NAME = "sympy"
ENGINE_CAPABILITIES = ["sympy"]

# Execution preamble prepended to every generated snippet (unicode pretty print
# + a show() helper + matrix/int-list parsers used by the templates).
PREAMBLE = '''from sympy import *
import sympy
from sympy.ntheory.modular import crt
from sympy.combinatorics import Permutation, PermutationGroup
sympy.init_printing(use_unicode=True, wrap_line=False)

def _parse_matrix(s):
    s = str(s).strip()
    rows = [r.strip() for r in s.replace('\\n', ';').split(';') if r.strip()]
    return Matrix([[sympify(c) for c in row.replace(',', ' ').split()] for row in rows])

def _parse_int_list(s):
    out = []
    for v in str(s).replace('\\n', ',').split(','):
        v = v.strip()
        if v != '':
            out.append(int(v))
    return out

def show(x, label=None):
    if label is not None:
        print(label)
    try:
        pprint(x, use_unicode=True, wrap_line=False, num_columns=120)
    except Exception:
        print(x)
    print()
'''


def list_templates_json():
    """Template metadata for the sidebar/form (JSON-serializable)."""
    return [t.to_dict() for t in ALL_TEMPLATES]


def engine_info():
    return {"name": ENGINE_NAME, "capabilities": ENGINE_CAPABILITIES}


def can_run(template_id):
    t = _BY_ID.get(template_id)
    return bool(t) and t.needs_engine in ENGINE_CAPABILITIES


def runnable_code(template_id, params):
    """Preamble + generated snippet for the given template and raw params."""
    t = _BY_ID.get(template_id)
    if t is None:
        raise KeyError(template_id)
    coerced = coerce_params(t, params)
    return PREAMBLE + chr(10) + t.generate(coerced)


def gen_only(template_id, params):
    """Generated snippet WITHOUT the preamble (for the 'generated code' pane)."""
    t = _BY_ID.get(template_id)
    if t is None:
        raise KeyError(template_id)
    coerced = coerce_params(t, params)
    return t.generate(coerced)
