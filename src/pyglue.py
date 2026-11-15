import ast, sys, json, traceback
import js
from pyodide.ffi import to_js, JsException

import contextvars
class RobotStopped(BaseException):
    pass

_GEN = contextvars.ContextVar('gen', default=0)
_cur = [0]

def _stale():
    if _GEN.get() != _cur[0]:
        raise RobotStopped('A newer run replaced this one.')

def _clean(e):
    m = str(e)
    for p in ("Error: ", "JsException: "):
        if m.startswith(p):
            m = m[len(p):]
    return m.strip()

async def _do(b):
    _stale()
    try:
        await js.MM_live.do(to_js(b, dict_converter=js.Object.fromEntries))
    except JsException as e:
        raise RobotStopped(_clean(e))

def _sense(name, arg=None):
    try:
        return js.MM_live.sense(name, arg)
    except JsException as e:
        raise RuntimeError(_clean(e)) from None

def _num(x, what):
    if isinstance(x, bool) or not isinstance(x, (int, float)):
        raise TypeError(what + " needs a number, like " + what + "(50)")
    return x

_lc_n = 0
def _lc():
    global _lc_n
    _lc_n += 1
    return _lc_n % 400 == 0

async def _yield():
    _stale()
    try:
        await js.MM_live.tick()
    except JsException as e:
        raise RobotStopped(_clean(e))

async def _sleep(sec):
    await _do({"t": "wait", "v": _num(sec, "sleep")})

class _Bot:
    async def forward(self, cm): await _do({"t": "fwd", "v": _num(cm, "forward")})
    async def backward(self, cm): await _do({"t": "back", "v": _num(cm, "backward")})
    async def turn_left(self, deg): await _do({"t": "left", "v": _num(deg, "turn_left")})
    async def turn_right(self, deg): await _do({"t": "right", "v": _num(deg, "turn_right")})
    async def pump(self, sec=1.2): await _do({"t": "water"})
    async def gripper_close(self): await _do({"t": "gripc"})
    async def gripper_open(self): await _do({"t": "gripo"})
    async def beep(self, sec=0.3): await _do({"t": "beep"})
    async def stop(self): await _do({"t": "stop"})
    async def relay(self, on): await _do({"t": "fanon" if on else "fanoff"})
    async def led(self, colour): await _do({"t": "led", "q": str(colour)})
    async def lcd(self, text): await _do({"t": "print", "q": str(text)})
    def distance(self, side="front"): return _sense("distance", side)
    def line(self, side): return _sense("line", side)
    def soil_percent(self): return _sense("soil")
    def light_percent(self): return _sense("light")
    def temperature_c(self): return _sense("temperature")
    def humidity_percent(self): return _sense("humidity")
    def heading_deg(self): return _sense("heading")
    def distance_travelled_cm(self): return _sense("odo")
    def bumper_pressed(self): return _sense("bump")
    def camera_sees_object(self): return _sense("cam")
    def color(self): return _sense("color")
    def begin(self, *a, **k): pass

class _Arm:
    async def base(self, deg): await _do({"t": "armb", "v": _num(deg, "base")})
    async def shoulder(self, deg): await _do({"t": "arms", "v": _num(deg, "shoulder")})
    async def elbow(self, deg): await _do({"t": "arme", "v": _num(deg, "elbow")})
    def cube_colour(self): return _sense("cube")

class _Drone:
    async def takeoff(self): await _do({"t": "takeoff"})
    async def land(self): await _do({"t": "land"})
    async def up(self, cm): await _do({"t": "up", "v": _num(cm, "up")})
    async def down(self, cm): await _do({"t": "down", "v": _num(cm, "down")})
    async def forward(self, cm): await _do({"t": "fwd", "v": _num(cm, "forward")})
    async def turn_left(self, deg): await _do({"t": "left", "v": _num(deg, "turn_left")})
    async def turn_right(self, deg): await _do({"t": "right", "v": _num(deg, "turn_right")})
    def altitude(self): return _sense("alt")
    def front_cm(self): return _sense("dfront")
    def battery(self): return _sense("bat")
    def light_percent(self): return _sense("dlight")

class _Belt:
    async def run_until_box(self): await _do({"t": "beltgo"})
    async def stop(self): await _do({"t": "beltoff"})
    def box_at_pick_spot(self): return _sense("box")

bot = _Bot(); arm = _Arm(); drone = _Drone(); belt = _Belt()
bot.forward_drone = drone.forward
sys.modules["milestonebot"] = bot

ROOTS = {"bot": {"forward","backward","turn_left","turn_right","pump","gripper_close","gripper_open","beep","stop","relay","led","lcd"},
         "arm": {"base","shoulder","elbow"},
         "drone": {"takeoff","land","up","down","forward","turn_left","turn_right"},
         "belt": {"run_until_box","stop"},
         "time": {"sleep"}}

def _is_action(call, aliases, asyncnames):
    f = call.func
    if isinstance(f, ast.Attribute) and isinstance(f.value, ast.Name):
        root = aliases.get(f.value.id, f.value.id)
        if root in ROOTS and f.attr in ROOTS[root]:
            return True
    if isinstance(f, ast.Name) and f.id in asyncnames:
        return True
    if isinstance(f, ast.Attribute) and f.attr in asyncnames and not (isinstance(f.value, ast.Name) and f.value.id in ROOTS):
        return True
    return False

def _prepare(src):
    tree = ast.parse(src, "<robot>")
    aliases = {"bot": "bot", "arm": "arm", "drone": "drone", "belt": "belt", "time": "time"}
    extra_sleep = set()
    body = []
    for node in tree.body:
        if isinstance(node, ast.ImportFrom) and node.module == "time":
            for a in node.names:
                if a.name == "sleep":
                    extra_sleep.add(a.asname or "sleep")
            continue
        if isinstance(node, ast.Import):
            keep = []
            for a in node.names:
                if a.name == "milestonebot" and a.asname:
                    aliases[a.asname] = "bot"
                if a.name == "time" and a.asname:
                    aliases[a.asname] = "time"
                keep.append(a)
        body.append(node)
    tree.body = body
    defs = {}
    for n in ast.walk(tree):
        if isinstance(n, ast.FunctionDef) and not (n.name.startswith("__") and n.name.endswith("__")):
            defs.setdefault(n.name, []).append(n)
    asyncnames = set()
    changed = True
    while changed:
        changed = False
        for name, nodes in defs.items():
            if name in asyncnames:
                continue
            for fn in nodes:
                hit = False
                for c in ast.walk(fn):
                    if isinstance(c, ast.Call):
                        f = c.func
                        if isinstance(f, ast.Name) and f.id in extra_sleep:
                            hit = True
                        elif _is_action(c, aliases, asyncnames):
                            hit = True
                    if hit:
                        break
                if hit:
                    asyncnames.add(name)
                    changed = True
                    break

    class T(ast.NodeTransformer):
        def visit_Call(self, node):
            self.generic_visit(node)
            f = node.func
            if isinstance(f, ast.Name) and f.id in extra_sleep:
                node = ast.Call(func=ast.Name(id="_sleep", ctx=ast.Load()), args=node.args, keywords=node.keywords)
                return ast.copy_location(ast.Await(value=node), node)
            if isinstance(f, ast.Attribute) and isinstance(f.value, ast.Name) and aliases.get(f.value.id) == "time" and f.attr == "sleep":
                node = ast.Call(func=ast.Name(id="_sleep", ctx=ast.Load()), args=node.args, keywords=node.keywords)
                return ast.copy_location(ast.Await(value=node), node)
            if _is_action(node, aliases, asyncnames):
                return ast.copy_location(ast.Await(value=node), node)
            return node
        def visit_FunctionDef(self, node):
            self.generic_visit(node)
            if node.name in asyncnames:
                new = ast.AsyncFunctionDef(name=node.name, args=node.args, body=node.body, decorator_list=node.decorator_list, returns=node.returns, type_comment=None)
                return ast.copy_location(new, node)
            return node
        def _loop(self, node):
            self.generic_visit(node)
            guard = ast.If(test=ast.Call(func=ast.Name(id="_lc", ctx=ast.Load()), args=[], keywords=[]),
                           body=[ast.Expr(value=ast.Await(value=ast.Call(func=ast.Name(id="_yield", ctx=ast.Load()), args=[], keywords=[])))], orelse=[])
            node.body = [ast.copy_location(guard, node)] + node.body
            return node
        visit_While = _loop
        visit_For = _loop
    tree = T().visit(tree)
    ast.fix_missing_locations(tree)
    return tree

async def _run(src, gen=0):
    _cur[0] = gen
    _GEN.set(gen)
    out = {"ok": True}
    g = {"__name__": "__main__", "bot": bot, "arm": arm, "drone": drone, "belt": belt, "_sleep": _sleep, "sleep": _sleep, "_lc": _lc, "_yield": _yield}
    try:
        tree = _prepare(src)
        code = compile(tree, "<robot>", "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
        r = eval(code, g)
        if r is not None and hasattr(r, "__await__"):
            await r
    except RobotStopped as e:
        out = {"ok": False, "stopped": True, "msg": str(e)}
    except SystemExit:
        pass
    except SyntaxError as e:
        out = {"ok": False, "line": e.lineno or 0, "msg": "Syntax problem: " + (e.msg or "check this line")}
    except BaseException as e:
        line = 0
        for fr in traceback.extract_tb(e.__traceback__):
            if fr.filename == "<robot>":
                line = fr.lineno
        msg = type(e).__name__ + ": " + str(e)
        if isinstance(e, SyntaxError):
            msg = "Syntax problem"
        out = {"ok": False, "line": line, "msg": msg}
    return json.dumps(out)
