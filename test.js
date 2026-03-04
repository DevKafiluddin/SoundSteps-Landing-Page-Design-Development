(function() {
    const a = document.createElement("link").relList;
    if (a && a.supports && a.supports("modulepreload"))
        return;
    for (const c of document.querySelectorAll('link[rel="modulepreload"]'))
        u(c);
    new MutationObserver(c => {
        for (const f of c)
            if (f.type === "childList")
                for (const d of f.addedNodes)
                    d.tagName === "LINK" && d.rel === "modulepreload" && u(d)
    }
    ).observe(document, {
        childList: !0,
        subtree: !0
    });
    function r(c) {
        const f = {};
        return c.integrity && (f.integrity = c.integrity),
        c.referrerPolicy && (f.referrerPolicy = c.referrerPolicy),
        c.crossOrigin === "use-credentials" ? f.credentials = "include" : c.crossOrigin === "anonymous" ? f.credentials = "omit" : f.credentials = "same-origin",
        f
    }
    function u(c) {
        if (c.ep)
            return;
        c.ep = !0;
        const f = r(c);
        fetch(c.href, f)
    }
}
)();
const Os = [];
let dg = !0;
const hg = console.error;
function em(s) {
    Os.length > 5 || !dg || Os.push(s)
}
function mg(s) {
    Os.push({
        type: "runtime",
        args: s
    })
}
function gg(s) {
    s.preventDefault()
}
function Uy(s) {
    try {
        const a = s.find(r => r instanceof Error);
        if (a && a.stack)
            em({
                type: "console.error",
                args: a
            });
        else if (s.length > 0) {
            const r = s.map(c => typeof c == "object" ? JSON.stringify(c) : String(c)).join(" ")
              , u = new Error(r);
            em({
                type: "console.error",
                args: u
            })
        }
    } catch (a) {
        console.warn(a)
    }
}
window.addEventListener("error", mg);
window.addEventListener("unhandledrejection", gg);
console.error = function(...a) {
    Uy(a),
    hg.apply(this, a)
}
;
function Hy() {
    return window.removeEventListener("error", mg),
    window.removeEventListener("unhandledrejection", gg),
    console.error = hg,
    dg = !1,
    Os
}
const By = 1e3
  , tm = Symbol("postMessageResponseTimeout");
let bs = 0;
const lo = "*";
class Xl {
    client;
    baseTimeout;
    waitRes = new Map;
    removeListeners = new Set;
    clear;
    constructor(a, r) {
        this.client = a,
        this.baseTimeout = r?.timeout || By;
        const u = this.emitResponse.bind(this);
        this.clear = () => {
            window.removeEventListener("message", u)
        }
        ,
        window.addEventListener("message", u)
    }
    destroy() {
        this.clear(),
        this.removeListeners.forEach(a => a())
    }
    isTimeout(a) {
        return a === tm
    }
    post(a, r, u) {
        bs++;
        const {timeout: c, origin: f=lo} = u || {};
        return this.client.postMessage({
            data: r,
            id: bs,
            type: a
        }, f),
        new Promise(d => {
            this.waitRes.set(bs, m => {
                d(m)
            }
            ),
            setTimeout( () => {
                this.waitRes.delete(bs),
                d(tm)
            }
            , c || this.baseTimeout)
        }
        )
    }
    on(a, r, u) {
        const {once: c, origin: f=lo} = u || {}
          , d = async g => {
            const {id: p, type: b, data: x} = g.data;
            let E;
            b === a && (E = await r(x),
            console.log(a, c, E, x),
            (p && f === g.origin || f === lo) && g.source?.postMessage({
                fromType: a,
                id: p,
                data: E
            }, g.origin),
            c && m())
        }
        ;
        window.addEventListener("message", d);
        const m = () => {
            window.removeEventListener("message", d),
            this.removeListeners.delete(m)
        }
        ;
        return this.removeListeners.add(m),
        m
    }
    emitResponse(a) {
        const r = a.data
          , {id: u, data: c} = r
          , f = this.waitRes.get(u);
        f && f(c)
    }
}
class qy {
    #e = new WeakMap;
    #n;
    #l;
    #t = !1;
    constructor() {
        this.#n = HTMLElement.prototype.addEventListener,
        this.#l = HTMLElement.prototype.removeEventListener
    }
    patch() {
        if (this.#t)
            return;
        const a = this;
        HTMLElement.prototype.addEventListener = function(r, u, c) {
            return a.#a(this, r, u),
            a.#n.call(this, r, u, c)
        }
        ,
        HTMLElement.prototype.removeEventListener = function(r, u, c) {
            return a.#i(this, r, u),
            a.#l.call(this, r, u, c)
        }
        ,
        this.#t = !0,
        console.log("[EventListenerRegistry] ✅ addEventListener patched")
    }
    unpatch() {
        this.#t && (HTMLElement.prototype.addEventListener = this.#n,
        HTMLElement.prototype.removeEventListener = this.#l,
        this.#t = !1,
        console.log("[EventListenerRegistry] ⚠️ addEventListener unpatched"))
    }
    #a(a, r, u) {
        let c = this.#e.get(a);
        c || (c = new Map,
        this.#e.set(a, c));
        let f = c.get(r);
        f || (f = new Set,
        c.set(r, f)),
        f.add(u)
    }
    #i(a, r, u) {
        const c = this.#e.get(a);
        if (!c)
            return;
        const f = c.get(r);
        f && (f.delete(u),
        f.size === 0 && c.delete(r))
    }
    hasListeners(a, r) {
        const u = this.#e.get(a);
        return !u || u.size === 0 ? !1 : r ? r.some(c => {
            const f = u.get(c);
            return f && f.size > 0
        }
        ) : !0
    }
    getEventTypes(a) {
        const r = this.#e.get(a);
        return r ? Array.from(r.keys()) : []
    }
    getListenerCount(a, r) {
        const u = this.#e.get(a);
        if (!u)
            return 0;
        const c = u.get(r);
        return c ? c.size : 0
    }
    getDebugInfo() {
        return {
            patched: this.#t,
            note: "WeakMap is used for automatic memory cleanup. Cannot enumerate elements."
        }
    }
    getElementDebugInfo(a) {
        const r = this.#e.get(a);
        return r ? {
            element: a,
            tag: a.tagName,
            className: a.className,
            hasListeners: !0,
            eventTypes: Array.from(r.keys()),
            totalListeners: Array.from(r.values()).reduce( (u, c) => u + c.size, 0)
        } : {
            element: a,
            hasListeners: !1,
            eventTypes: [],
            totalListeners: 0
        }
    }
}
const Ql = new qy
  , pg = ["click", "dblclick", "contextmenu", "mousedown", "mouseup", "mousemove", "mouseenter", "mouseleave", "mouseover", "mouseout", "touchstart", "touchmove", "touchend", "touchcancel", "pointerdown", "pointerup", "pointermove", "pointerenter", "pointerleave", "pointerover", "pointerout", "pointercancel"];
function Uo(s) {
    return Ql.hasListeners(s, pg)
}
function yg(s) {
    return Ql.getEventTypes(s).filter(r => pg.includes(r))
}
function vg(s) {
    const a = yg(s)
      , r = {};
    return a.forEach(u => {
        r[u] = Ql.getListenerCount(s, u)
    }
    ),
    {
        hasEvents: a.length > 0,
        eventTypes: a,
        listeners: r
    }
}
function Gy(s) {
    return Ql.getElementDebugInfo(s)
}
function xg(s=window) {
    Ql.patch(),
    s.__eventListenerRegistry__ = {
        hasListeners: Uo,
        getEventTypes: yg,
        getDetail: vg,
        getDebugInfo: () => Ql.getDebugInfo(),
        getElementDebugInfo: Gy
    },
    console.log("[EnhancedEventDetector] ✅ Initialized and patched addEventListener")
}
typeof window < "u" && xg(window);
const Ho = ["onClick", "onDoubleClick", "onContextMenu", "onMouseDown", "onMouseUp", "onPointerDown", "onPointerUp", "onTouchStart", "onTouchEnd", "onDragStart", "onDrop", "onChange", "onSubmit", "onKeyDown", "onKeyUp"];
function Bo(s) {
    const a = Object.keys(s).find(r => r.startsWith("__reactFiber$") || r.startsWith("__reactInternalInstance$"));
    return a ? s[a] : null
}
function bg(s) {
    return !s || typeof s != "object" ? !1 : Ho.some(a => typeof s[a] == "function")
}
function Yy(s) {
    return !s || typeof s != "object" ? [] : Ho.filter(a => typeof s[a] == "function")
}
function Sg(s) {
    let a = Bo(s);
    for (; a; ) {
        if (a.memoizedProps && bg(a.memoizedProps))
            return !0;
        a = a.return || null
    }
    return !1
}
function Eg(s) {
    const a = {
        hasEvents: !1,
        events: []
    };
    let r = Bo(s);
    for (; r; ) {
        if (r.memoizedProps) {
            const u = Yy(r.memoizedProps);
            if (u.length > 0) {
                a.hasEvents = !0;
                const c = r.type?.displayName || r.type?.name || r.elementType?.name || "Unknown";
                a.events.push({
                    componentName: c,
                    eventNames: u,
                    props: r.memoizedProps
                })
            }
        }
        r = r.return || null
    }
    return a
}
function wg(s) {
    const a = Bo(s);
    return !a || !a.memoizedProps ? !1 : bg(a.memoizedProps)
}
function _g(s=window) {
    s.__reactEventDetector__ = {
        hasReactInteractionEvents: Sg,
        getReactInteractionEventsDetail: Eg,
        hasReactInteractionEventsOnSelf: wg,
        REACT_EVENT_PROPS: Ho
    },
    console.log("[ReactEventDetector] Injected to window.__reactEventDetector__")
}
typeof window < "u" && _g(window);
function Cg(s) {
    return s ? Sg(s) || Uo(s) : !1
}
function Vy(s) {
    return s ? wg(s) || Uo(s) : !1
}
function qo(s) {
    const a = Eg(s)
      , r = vg(s);
    return {
        hasEvents: a.hasEvents || r.hasEvents,
        react: a,
        native: r
    }
}
function Go(s) {
    if (!s)
        return {
            error: "selector is required"
        };
    const a = document.querySelector(s);
    if (!a)
        return {
            error: "Element not found",
            selector: s
        };
    const r = qo(a);
    return {
        selector: s,
        hasEvents: r.hasEvents
    }
}
function Ng(s, a) {
    if (typeof s != "number" || typeof a != "number")
        return {
            error: "x and y must be numbers"
        };
    const r = document.elementFromPoint(s, a);
    if (!r)
        return {
            error: "No element at point",
            x: s,
            y: a
        };
    const u = qo(r);
    return {
        x: s,
        y: a,
        hasEvents: u.hasEvents
    }
}
function ky(s) {
    return s.map(a => ({
        element: a,
        hasEvents: Cg(a)
    }))
}
function Tg(s) {
    return s.map(a => ({
        selector: a,
        result: Go(a)
    }))
}
const nm = "1.0.0";
function Qy() {
    window.__interactionDetector__ = {
        hasInteractionEvents: Cg,
        hasInteractionEventsOnSelf: Vy,
        getDetail: qo,
        checkBySelector: Go,
        checkByPoint: Ng,
        checkMultiple: ky,
        checkMultipleSelectors: Tg,
        version: nm
    },
    console.log(`[InteractionDetector] Global API initialized (v${nm})`)
}
function Xy() {
    const s = new Xl(window.parent);
    s.on("checkInteraction", a => {
        const {selector: r, x: u, y: c} = a || {};
        return r ? Go(r) : typeof u == "number" && typeof c == "number" ? Ng(u, c) : {
            error: "Invalid params: need selector or (x, y)"
        }
    }
    ),
    s.on("checkMultipleSelectors", a => {
        const {selectors: r} = a || {};
        return !r || !Array.isArray(r) ? {
            error: "selectors array is required"
        } : Tg(r)
    }
    ),
    console.log("[InteractionDetector] PostMessage listener initialized")
}
function Ky() {
    xg(),
    _g(),
    Qy(),
    Xy(),
    console.log("[Continue] Module fully initialized")
}
function Zy(s) {
    return s && s.__esModule && Object.prototype.hasOwnProperty.call(s, "default") ? s.default : s
}
function Jy(s) {
    if (Object.prototype.hasOwnProperty.call(s, "__esModule"))
        return s;
    var a = s.default;
    if (typeof a == "function") {
        var r = function u() {
            var c = !1;
            try {
                c = this instanceof u
            } catch {}
            return c ? Reflect.construct(a, arguments, this.constructor) : a.apply(this, arguments)
        };
        r.prototype = a.prototype
    } else
        r = {};
    return Object.defineProperty(r, "__esModule", {
        value: !0
    }),
    Object.keys(s).forEach(function(u) {
        var c = Object.getOwnPropertyDescriptor(s, u);
        Object.defineProperty(r, u, c.get ? c : {
            enumerable: !0,
            get: function() {
                return s[u]
            }
        })
    }),
    r
}
var Ga = {}, ao = {}, io = {}, so = {}, lm;
function $y() {
    if (lm)
        return so;
    lm = 1;
    const s = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
    return so.encode = function(a) {
        if (0 <= a && a < s.length)
            return s[a];
        throw new TypeError("Must be between 0 and 63: " + a)
    }
    ,
    so
}
var am;
function jg() {
    if (am)
        return io;
    am = 1;
    const s = $y()
      , a = 5
      , r = 1 << a
      , u = r - 1
      , c = r;
    function f(d) {
        return d < 0 ? (-d << 1) + 1 : (d << 1) + 0
    }
    return io.encode = function(m) {
        let g = "", p, b = f(m);
        do
            p = b & u,
            b >>>= a,
            b > 0 && (p |= c),
            g += s.encode(p);
        while (b > 0);
        return g
    }
    ,
    io
}
var Dt = {};
const Fy = {}
  , Wy = Object.freeze(Object.defineProperty({
    __proto__: null,
    default: Fy
}, Symbol.toStringTag, {
    value: "Module"
}))
  , Iy = Jy(Wy);
var ro, im;
function Py() {
    return im || (im = 1,
    ro = typeof URL == "function" ? URL : Iy.URL),
    ro
}
var sm;
function zs() {
    if (sm)
        return Dt;
    sm = 1;
    const s = Py();
    function a(k, X, Z) {
        if (X in k)
            return k[X];
        if (arguments.length === 3)
            return Z;
        throw new Error('"' + X + '" is a required argument.')
    }
    Dt.getArg = a;
    const r = (function() {
        return !("__proto__"in Object.create(null))
    }
    )();
    function u(k) {
        return k
    }
    function c(k) {
        return d(k) ? "$" + k : k
    }
    Dt.toSetString = r ? u : c;
    function f(k) {
        return d(k) ? k.slice(1) : k
    }
    Dt.fromSetString = r ? u : f;
    function d(k) {
        if (!k)
            return !1;
        const X = k.length;
        if (X < 9 || k.charCodeAt(X - 1) !== 95 || k.charCodeAt(X - 2) !== 95 || k.charCodeAt(X - 3) !== 111 || k.charCodeAt(X - 4) !== 116 || k.charCodeAt(X - 5) !== 111 || k.charCodeAt(X - 6) !== 114 || k.charCodeAt(X - 7) !== 112 || k.charCodeAt(X - 8) !== 95 || k.charCodeAt(X - 9) !== 95)
            return !1;
        for (let Z = X - 10; Z >= 0; Z--)
            if (k.charCodeAt(Z) !== 36)
                return !1;
        return !0
    }
    function m(k, X) {
        return k === X ? 0 : k === null ? 1 : X === null ? -1 : k > X ? 1 : -1
    }
    function g(k, X) {
        let Z = k.generatedLine - X.generatedLine;
        return Z !== 0 || (Z = k.generatedColumn - X.generatedColumn,
        Z !== 0) || (Z = m(k.source, X.source),
        Z !== 0) || (Z = k.originalLine - X.originalLine,
        Z !== 0) || (Z = k.originalColumn - X.originalColumn,
        Z !== 0) ? Z : m(k.name, X.name)
    }
    Dt.compareByGeneratedPositionsInflated = g;
    function p(k) {
        return JSON.parse(k.replace(/^\)]}'[^\n]*\n/, ""))
    }
    Dt.parseSourceMapInput = p;
    const b = "http:"
      , x = `${b}//host`;
    function E(k) {
        return X => {
            const Z = L(X)
              , ne = j(X)
              , oe = new s(X,ne);
            k(oe);
            const fe = oe.toString();
            return Z === "absolute" ? fe : Z === "scheme-relative" ? fe.slice(b.length) : Z === "path-absolute" ? fe.slice(x.length) : G(ne, fe)
        }
    }
    function S(k, X) {
        return new s(k,X).toString()
    }
    function w(k, X) {
        let Z = 0;
        do {
            const ne = k + Z++;
            if (X.indexOf(ne) === -1)
                return ne
        } while (!0)
    }
    function j(k) {
        const X = k.split("..").length - 1
          , Z = w("p", k);
        let ne = `${x}/`;
        for (let oe = 0; oe < X; oe++)
            ne += `${Z}/`;
        return ne
    }
    const _ = /^[A-Za-z0-9\+\-\.]+:/;
    function L(k) {
        return k[0] === "/" ? k[1] === "/" ? "scheme-relative" : "path-absolute" : _.test(k) ? "absolute" : "path-relative"
    }
    function G(k, X) {
        typeof k == "string" && (k = new s(k)),
        typeof X == "string" && (X = new s(X));
        const Z = X.pathname.split("/")
          , ne = k.pathname.split("/");
        for (ne.length > 0 && !ne[ne.length - 1] && ne.pop(); Z.length > 0 && ne.length > 0 && Z[0] === ne[0]; )
            Z.shift(),
            ne.shift();
        return ne.map( () => "..").concat(Z).join("/") + X.search + X.hash
    }
    const V = E(k => {
        k.pathname = k.pathname.replace(/\/?$/, "/")
    }
    )
      , J = E(k => {
        k.href = new s(".",k.toString()).toString()
    }
    )
      , W = E(k => {}
    );
    Dt.normalize = W;
    function ue(k, X) {
        const Z = L(X)
          , ne = L(k);
        if (k = V(k),
        Z === "absolute")
            return S(X, void 0);
        if (ne === "absolute")
            return S(X, k);
        if (Z === "scheme-relative")
            return W(X);
        if (ne === "scheme-relative")
            return S(X, S(k, x)).slice(b.length);
        if (Z === "path-absolute")
            return W(X);
        if (ne === "path-absolute")
            return S(X, S(k, x)).slice(x.length);
        const oe = j(X + k)
          , fe = S(X, S(k, oe));
        return G(oe, fe)
    }
    Dt.join = ue;
    function I(k, X) {
        const Z = ye(k, X);
        return typeof Z == "string" ? Z : W(X)
    }
    Dt.relative = I;
    function ye(k, X) {
        if (L(k) !== L(X))
            return null;
        const ne = j(k + X)
          , oe = new s(k,ne)
          , fe = new s(X,ne);
        try {
            new s("",fe.toString())
        } catch {
            return null
        }
        return fe.protocol !== oe.protocol || fe.user !== oe.user || fe.password !== oe.password || fe.hostname !== oe.hostname || fe.port !== oe.port ? null : G(oe, fe)
    }
    function Ce(k, X, Z) {
        k && L(X) === "path-absolute" && (X = X.replace(/^\//, ""));
        let ne = W(X || "");
        return k && (ne = ue(k, ne)),
        Z && (ne = ue(J(Z), ne)),
        ne
    }
    return Dt.computeSourceURL = Ce,
    Dt
}
var uo = {}, rm;
function Og() {
    if (rm)
        return uo;
    rm = 1;
    class s {
        constructor() {
            this._array = [],
            this._set = new Map
        }
        static fromArray(r, u) {
            const c = new s;
            for (let f = 0, d = r.length; f < d; f++)
                c.add(r[f], u);
            return c
        }
        size() {
            return this._set.size
        }
        add(r, u) {
            const c = this.has(r)
              , f = this._array.length;
            (!c || u) && this._array.push(r),
            c || this._set.set(r, f)
        }
        has(r) {
            return this._set.has(r)
        }
        indexOf(r) {
            const u = this._set.get(r);
            if (u >= 0)
                return u;
            throw new Error('"' + r + '" is not in the set.')
        }
        at(r) {
            if (r >= 0 && r < this._array.length)
                return this._array[r];
            throw new Error("No element indexed by " + r)
        }
        toArray() {
            return this._array.slice()
        }
    }
    return uo.ArraySet = s,
    uo
}
var oo = {}, um;
function ev() {
    if (um)
        return oo;
    um = 1;
    const s = zs();
    function a(u, c) {
        const f = u.generatedLine
          , d = c.generatedLine
          , m = u.generatedColumn
          , g = c.generatedColumn;
        return d > f || d == f && g >= m || s.compareByGeneratedPositionsInflated(u, c) <= 0
    }
    class r {
        constructor() {
            this._array = [],
            this._sorted = !0,
            this._last = {
                generatedLine: -1,
                generatedColumn: 0
            }
        }
        unsortedForEach(c, f) {
            this._array.forEach(c, f)
        }
        add(c) {
            a(this._last, c) ? (this._last = c,
            this._array.push(c)) : (this._sorted = !1,
            this._array.push(c))
        }
        toArray() {
            return this._sorted || (this._array.sort(s.compareByGeneratedPositionsInflated),
            this._sorted = !0),
            this._array
        }
    }
    return oo.MappingList = r,
    oo
}
var om;
function Ag() {
    if (om)
        return ao;
    om = 1;
    const s = jg()
      , a = zs()
      , r = Og().ArraySet
      , u = ev().MappingList;
    class c {
        constructor(d) {
            d || (d = {}),
            this._file = a.getArg(d, "file", null),
            this._sourceRoot = a.getArg(d, "sourceRoot", null),
            this._skipValidation = a.getArg(d, "skipValidation", !1),
            this._sources = new r,
            this._names = new r,
            this._mappings = new u,
            this._sourcesContents = null
        }
        static fromSourceMap(d) {
            const m = d.sourceRoot
              , g = new c({
                file: d.file,
                sourceRoot: m
            });
            return d.eachMapping(function(p) {
                const b = {
                    generated: {
                        line: p.generatedLine,
                        column: p.generatedColumn
                    }
                };
                p.source != null && (b.source = p.source,
                m != null && (b.source = a.relative(m, b.source)),
                b.original = {
                    line: p.originalLine,
                    column: p.originalColumn
                },
                p.name != null && (b.name = p.name)),
                g.addMapping(b)
            }),
            d.sources.forEach(function(p) {
                let b = p;
                m != null && (b = a.relative(m, p)),
                g._sources.has(b) || g._sources.add(b);
                const x = d.sourceContentFor(p);
                x != null && g.setSourceContent(p, x)
            }),
            g
        }
        addMapping(d) {
            const m = a.getArg(d, "generated")
              , g = a.getArg(d, "original", null);
            let p = a.getArg(d, "source", null)
              , b = a.getArg(d, "name", null);
            this._skipValidation || this._validateMapping(m, g, p, b),
            p != null && (p = String(p),
            this._sources.has(p) || this._sources.add(p)),
            b != null && (b = String(b),
            this._names.has(b) || this._names.add(b)),
            this._mappings.add({
                generatedLine: m.line,
                generatedColumn: m.column,
                originalLine: g && g.line,
                originalColumn: g && g.column,
                source: p,
                name: b
            })
        }
        setSourceContent(d, m) {
            let g = d;
            this._sourceRoot != null && (g = a.relative(this._sourceRoot, g)),
            m != null ? (this._sourcesContents || (this._sourcesContents = Object.create(null)),
            this._sourcesContents[a.toSetString(g)] = m) : this._sourcesContents && (delete this._sourcesContents[a.toSetString(g)],
            Object.keys(this._sourcesContents).length === 0 && (this._sourcesContents = null))
        }
        applySourceMap(d, m, g) {
            let p = m;
            if (m == null) {
                if (d.file == null)
                    throw new Error(`SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's "file" property. Both were omitted.`);
                p = d.file
            }
            const b = this._sourceRoot;
            b != null && (p = a.relative(b, p));
            const x = this._mappings.toArray().length > 0 ? new r : this._sources
              , E = new r;
            this._mappings.unsortedForEach(function(S) {
                if (S.source === p && S.originalLine != null) {
                    const _ = d.originalPositionFor({
                        line: S.originalLine,
                        column: S.originalColumn
                    });
                    _.source != null && (S.source = _.source,
                    g != null && (S.source = a.join(g, S.source)),
                    b != null && (S.source = a.relative(b, S.source)),
                    S.originalLine = _.line,
                    S.originalColumn = _.column,
                    _.name != null && (S.name = _.name))
                }
                const w = S.source;
                w != null && !x.has(w) && x.add(w);
                const j = S.name;
                j != null && !E.has(j) && E.add(j)
            }, this),
            this._sources = x,
            this._names = E,
            d.sources.forEach(function(S) {
                const w = d.sourceContentFor(S);
                w != null && (g != null && (S = a.join(g, S)),
                b != null && (S = a.relative(b, S)),
                this.setSourceContent(S, w))
            }, this)
        }
        _validateMapping(d, m, g, p) {
            if (m && typeof m.line != "number" && typeof m.column != "number")
                throw new Error("original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.");
            if (!(d && "line"in d && "column"in d && d.line > 0 && d.column >= 0 && !m && !g && !p)) {
                if (!(d && "line"in d && "column"in d && m && "line"in m && "column"in m && d.line > 0 && d.column >= 0 && m.line > 0 && m.column >= 0 && g))
                    throw new Error("Invalid mapping: " + JSON.stringify({
                        generated: d,
                        source: g,
                        original: m,
                        name: p
                    }))
            }
        }
        _serializeMappings() {
            let d = 0, m = 1, g = 0, p = 0, b = 0, x = 0, E = "", S, w, j, _;
            const L = this._mappings.toArray();
            for (let G = 0, V = L.length; G < V; G++) {
                if (w = L[G],
                S = "",
                w.generatedLine !== m)
                    for (d = 0; w.generatedLine !== m; )
                        S += ";",
                        m++;
                else if (G > 0) {
                    if (!a.compareByGeneratedPositionsInflated(w, L[G - 1]))
                        continue;
                    S += ","
                }
                S += s.encode(w.generatedColumn - d),
                d = w.generatedColumn,
                w.source != null && (_ = this._sources.indexOf(w.source),
                S += s.encode(_ - x),
                x = _,
                S += s.encode(w.originalLine - 1 - p),
                p = w.originalLine - 1,
                S += s.encode(w.originalColumn - g),
                g = w.originalColumn,
                w.name != null && (j = this._names.indexOf(w.name),
                S += s.encode(j - b),
                b = j)),
                E += S
            }
            return E
        }
        _generateSourcesContent(d, m) {
            return d.map(function(g) {
                if (!this._sourcesContents)
                    return null;
                m != null && (g = a.relative(m, g));
                const p = a.toSetString(g);
                return Object.prototype.hasOwnProperty.call(this._sourcesContents, p) ? this._sourcesContents[p] : null
            }, this)
        }
        toJSON() {
            const d = {
                version: this._version,
                sources: this._sources.toArray(),
                names: this._names.toArray(),
                mappings: this._serializeMappings()
            };
            return this._file != null && (d.file = this._file),
            this._sourceRoot != null && (d.sourceRoot = this._sourceRoot),
            this._sourcesContents && (d.sourcesContent = this._generateSourcesContent(d.sources, d.sourceRoot)),
            d
        }
        toString() {
            return JSON.stringify(this.toJSON())
        }
    }
    return c.prototype._version = 3,
    ao.SourceMapGenerator = c,
    ao
}
var Ya = {}, co = {}, cm;
function tv() {
    return cm || (cm = 1,
    (function(s) {
        s.GREATEST_LOWER_BOUND = 1,
        s.LEAST_UPPER_BOUND = 2;
        function a(r, u, c, f, d, m) {
            const g = Math.floor((u - r) / 2) + r
              , p = d(c, f[g], !0);
            return p === 0 ? g : p > 0 ? u - g > 1 ? a(g, u, c, f, d, m) : m === s.LEAST_UPPER_BOUND ? u < f.length ? u : -1 : g : g - r > 1 ? a(r, g, c, f, d, m) : m == s.LEAST_UPPER_BOUND ? g : r < 0 ? -1 : r
        }
        s.search = function(u, c, f, d) {
            if (c.length === 0)
                return -1;
            let m = a(-1, c.length, u, c, f, d || s.GREATEST_LOWER_BOUND);
            if (m < 0)
                return -1;
            for (; m - 1 >= 0 && f(c[m], c[m - 1], !0) === 0; )
                --m;
            return m
        }
    }
    )(co)),
    co
}
var Ss = {
    exports: {}
}, fm;
function Rg() {
    if (fm)
        return Ss.exports;
    fm = 1;
    let s = null;
    return Ss.exports = function() {
        if (typeof s == "string")
            return fetch(s).then(r => r.arrayBuffer());
        if (s instanceof ArrayBuffer)
            return Promise.resolve(s);
        throw new Error("You must provide the string URL or ArrayBuffer contents of lib/mappings.wasm by calling SourceMapConsumer.initialize({ 'lib/mappings.wasm': ... }) before using SourceMapConsumer")
    }
    ,
    Ss.exports.initialize = a => {
        s = a
    }
    ,
    Ss.exports
}
var fo, dm;
function nv() {
    if (dm)
        return fo;
    dm = 1;
    const s = Rg();
    function a() {
        this.generatedLine = 0,
        this.generatedColumn = 0,
        this.lastGeneratedColumn = null,
        this.source = null,
        this.originalLine = null,
        this.originalColumn = null,
        this.name = null
    }
    let r = null;
    return fo = function() {
        if (r)
            return r;
        const c = [];
        return r = s().then(f => WebAssembly.instantiate(f, {
            env: {
                mapping_callback(d, m, g, p, b, x, E, S, w, j) {
                    const _ = new a;
                    _.generatedLine = d + 1,
                    _.generatedColumn = m,
                    g && (_.lastGeneratedColumn = p - 1),
                    b && (_.source = x,
                    _.originalLine = E + 1,
                    _.originalColumn = S,
                    w && (_.name = j)),
                    c[c.length - 1](_)
                },
                start_all_generated_locations_for() {
                    console.time("all_generated_locations_for")
                },
                end_all_generated_locations_for() {
                    console.timeEnd("all_generated_locations_for")
                },
                start_compute_column_spans() {
                    console.time("compute_column_spans")
                },
                end_compute_column_spans() {
                    console.timeEnd("compute_column_spans")
                },
                start_generated_location_for() {
                    console.time("generated_location_for")
                },
                end_generated_location_for() {
                    console.timeEnd("generated_location_for")
                },
                start_original_location_for() {
                    console.time("original_location_for")
                },
                end_original_location_for() {
                    console.timeEnd("original_location_for")
                },
                start_parse_mappings() {
                    console.time("parse_mappings")
                },
                end_parse_mappings() {
                    console.timeEnd("parse_mappings")
                },
                start_sort_by_generated_location() {
                    console.time("sort_by_generated_location")
                },
                end_sort_by_generated_location() {
                    console.timeEnd("sort_by_generated_location")
                },
                start_sort_by_original_location() {
                    console.time("sort_by_original_location")
                },
                end_sort_by_original_location() {
                    console.timeEnd("sort_by_original_location")
                }
            }
        })).then(f => ({
            exports: f.instance.exports,
            withMappingCallback: (d, m) => {
                c.push(d);
                try {
                    m()
                } finally {
                    c.pop()
                }
            }
        })).then(null, f => {
            throw r = null,
            f
        }
        ),
        r
    }
    ,
    fo
}
var hm;
function lv() {
    if (hm)
        return Ya;
    hm = 1;
    const s = zs()
      , a = tv()
      , r = Og().ArraySet;
    jg();
    const u = Rg()
      , c = nv()
      , f = Symbol("smcInternal");
    class d {
        constructor(E, S) {
            return E == f ? Promise.resolve(this) : p(E, S)
        }
        static initialize(E) {
            u.initialize(E["lib/mappings.wasm"])
        }
        static fromSourceMap(E, S) {
            return b(E, S)
        }
        static async with(E, S, w) {
            const j = await new d(E,S);
            try {
                return await w(j)
            } finally {
                j.destroy()
            }
        }
        eachMapping(E, S, w) {
            throw new Error("Subclasses must implement eachMapping")
        }
        allGeneratedPositionsFor(E) {
            throw new Error("Subclasses must implement allGeneratedPositionsFor")
        }
        destroy() {
            throw new Error("Subclasses must implement destroy")
        }
    }
    d.prototype._version = 3,
    d.GENERATED_ORDER = 1,
    d.ORIGINAL_ORDER = 2,
    d.GREATEST_LOWER_BOUND = 1,
    d.LEAST_UPPER_BOUND = 2,
    Ya.SourceMapConsumer = d;
    class m extends d {
        constructor(E, S) {
            return super(f).then(w => {
                let j = E;
                typeof E == "string" && (j = s.parseSourceMapInput(E));
                const _ = s.getArg(j, "version")
                  , L = s.getArg(j, "sources").map(String)
                  , G = s.getArg(j, "names", [])
                  , V = s.getArg(j, "sourceRoot", null)
                  , J = s.getArg(j, "sourcesContent", null)
                  , W = s.getArg(j, "mappings")
                  , ue = s.getArg(j, "file", null)
                  , I = s.getArg(j, "x_google_ignoreList", null);
                if (_ != w._version)
                    throw new Error("Unsupported version: " + _);
                return w._sourceLookupCache = new Map,
                w._names = r.fromArray(G.map(String), !0),
                w._sources = r.fromArray(L, !0),
                w._absoluteSources = r.fromArray(w._sources.toArray().map(function(ye) {
                    return s.computeSourceURL(V, ye, S)
                }), !0),
                w.sourceRoot = V,
                w.sourcesContent = J,
                w._mappings = W,
                w._sourceMapURL = S,
                w.file = ue,
                w.x_google_ignoreList = I,
                w._computedColumnSpans = !1,
                w._mappingsPtr = 0,
                w._wasm = null,
                c().then(ye => (w._wasm = ye,
                w))
            }
            )
        }
        _findSourceIndex(E) {
            const S = this._sourceLookupCache.get(E);
            if (typeof S == "number")
                return S;
            const w = s.computeSourceURL(null, E, this._sourceMapURL);
            if (this._absoluteSources.has(w)) {
                const _ = this._absoluteSources.indexOf(w);
                return this._sourceLookupCache.set(E, _),
                _
            }
            const j = s.computeSourceURL(this.sourceRoot, E, this._sourceMapURL);
            if (this._absoluteSources.has(j)) {
                const _ = this._absoluteSources.indexOf(j);
                return this._sourceLookupCache.set(E, _),
                _
            }
            return -1
        }
        static fromSourceMap(E, S) {
            return new m(E.toString())
        }
        get sources() {
            return this._absoluteSources.toArray()
        }
        _getMappingsPtr() {
            return this._mappingsPtr === 0 && this._parseMappings(),
            this._mappingsPtr
        }
        _parseMappings() {
            const E = this._mappings
              , S = E.length
              , w = this._wasm.exports.allocate_mappings(S) >>> 0
              , j = new Uint8Array(this._wasm.exports.memory.buffer,w,S);
            for (let L = 0; L < S; L++)
                j[L] = E.charCodeAt(L);
            const _ = this._wasm.exports.parse_mappings(w);
            if (!_) {
                const L = this._wasm.exports.get_last_error();
                let G = `Error parsing mappings (code ${L}): `;
                switch (L) {
                case 1:
                    G += "the mappings contained a negative line, column, source index, or name index";
                    break;
                case 2:
                    G += "the mappings contained a number larger than 2**32";
                    break;
                case 3:
                    G += "reached EOF while in the middle of parsing a VLQ";
                    break;
                case 4:
                    G += "invalid base 64 character while parsing a VLQ";
                    break;
                default:
                    G += "unknown error code";
                    break
                }
                throw new Error(G)
            }
            this._mappingsPtr = _
        }
        eachMapping(E, S, w) {
            const j = S || null
              , _ = w || d.GENERATED_ORDER;
            this._wasm.withMappingCallback(L => {
                L.source !== null && (L.source = this._absoluteSources.at(L.source),
                L.name !== null && (L.name = this._names.at(L.name))),
                this._computedColumnSpans && L.lastGeneratedColumn === null && (L.lastGeneratedColumn = 1 / 0),
                E.call(j, L)
            }
            , () => {
                switch (_) {
                case d.GENERATED_ORDER:
                    this._wasm.exports.by_generated_location(this._getMappingsPtr());
                    break;
                case d.ORIGINAL_ORDER:
                    this._wasm.exports.by_original_location(this._getMappingsPtr());
                    break;
                default:
                    throw new Error("Unknown order of iteration.")
                }
            }
            )
        }
        allGeneratedPositionsFor(E) {
            let S = s.getArg(E, "source");
            const w = s.getArg(E, "line")
              , j = E.column || 0;
            if (S = this._findSourceIndex(S),
            S < 0)
                return [];
            if (w < 1)
                throw new Error("Line numbers must be >= 1");
            if (j < 0)
                throw new Error("Column numbers must be >= 0");
            const _ = [];
            return this._wasm.withMappingCallback(L => {
                let G = L.lastGeneratedColumn;
                this._computedColumnSpans && G === null && (G = 1 / 0),
                _.push({
                    line: L.generatedLine,
                    column: L.generatedColumn,
                    lastColumn: G
                })
            }
            , () => {
                this._wasm.exports.all_generated_locations_for(this._getMappingsPtr(), S, w - 1, "column"in E, j)
            }
            ),
            _
        }
        destroy() {
            this._mappingsPtr !== 0 && (this._wasm.exports.free_mappings(this._mappingsPtr),
            this._mappingsPtr = 0)
        }
        computeColumnSpans() {
            this._computedColumnSpans || (this._wasm.exports.compute_column_spans(this._getMappingsPtr()),
            this._computedColumnSpans = !0)
        }
        originalPositionFor(E) {
            const S = {
                generatedLine: s.getArg(E, "line"),
                generatedColumn: s.getArg(E, "column")
            };
            if (S.generatedLine < 1)
                throw new Error("Line numbers must be >= 1");
            if (S.generatedColumn < 0)
                throw new Error("Column numbers must be >= 0");
            let w = s.getArg(E, "bias", d.GREATEST_LOWER_BOUND);
            w == null && (w = d.GREATEST_LOWER_BOUND);
            let j;
            if (this._wasm.withMappingCallback(_ => j = _, () => {
                this._wasm.exports.original_location_for(this._getMappingsPtr(), S.generatedLine - 1, S.generatedColumn, w)
            }
            ),
            j && j.generatedLine === S.generatedLine) {
                let _ = s.getArg(j, "source", null);
                _ !== null && (_ = this._absoluteSources.at(_));
                let L = s.getArg(j, "name", null);
                return L !== null && (L = this._names.at(L)),
                {
                    source: _,
                    line: s.getArg(j, "originalLine", null),
                    column: s.getArg(j, "originalColumn", null),
                    name: L
                }
            }
            return {
                source: null,
                line: null,
                column: null,
                name: null
            }
        }
        hasContentsOfAllSources() {
            return this.sourcesContent ? this.sourcesContent.length >= this._sources.size() && !this.sourcesContent.some(function(E) {
                return E == null
            }) : !1
        }
        sourceContentFor(E, S) {
            if (!this.sourcesContent)
                return null;
            const w = this._findSourceIndex(E);
            if (w >= 0)
                return this.sourcesContent[w];
            if (S)
                return null;
            throw new Error('"' + E + '" is not in the SourceMap.')
        }
        generatedPositionFor(E) {
            let S = s.getArg(E, "source");
            if (S = this._findSourceIndex(S),
            S < 0)
                return {
                    line: null,
                    column: null,
                    lastColumn: null
                };
            const w = {
                source: S,
                originalLine: s.getArg(E, "line"),
                originalColumn: s.getArg(E, "column")
            };
            if (w.originalLine < 1)
                throw new Error("Line numbers must be >= 1");
            if (w.originalColumn < 0)
                throw new Error("Column numbers must be >= 0");
            let j = s.getArg(E, "bias", d.GREATEST_LOWER_BOUND);
            j == null && (j = d.GREATEST_LOWER_BOUND);
            let _;
            if (this._wasm.withMappingCallback(L => _ = L, () => {
                this._wasm.exports.generated_location_for(this._getMappingsPtr(), w.source, w.originalLine - 1, w.originalColumn, j)
            }
            ),
            _ && _.source === w.source) {
                let L = _.lastGeneratedColumn;
                return this._computedColumnSpans && L === null && (L = 1 / 0),
                {
                    line: s.getArg(_, "generatedLine", null),
                    column: s.getArg(_, "generatedColumn", null),
                    lastColumn: L
                }
            }
            return {
                line: null,
                column: null,
                lastColumn: null
            }
        }
    }
    m.prototype.consumer = d,
    Ya.BasicSourceMapConsumer = m;
    class g extends d {
        constructor(E, S) {
            return super(f).then(w => {
                let j = E;
                typeof E == "string" && (j = s.parseSourceMapInput(E));
                const _ = s.getArg(j, "version")
                  , L = s.getArg(j, "sections");
                if (_ != w._version)
                    throw new Error("Unsupported version: " + _);
                let G = {
                    line: -1,
                    column: 0
                };
                return Promise.all(L.map(V => {
                    if (V.url)
                        throw new Error("Support for url field in sections not implemented.");
                    const J = s.getArg(V, "offset")
                      , W = s.getArg(J, "line")
                      , ue = s.getArg(J, "column");
                    if (W < G.line || W === G.line && ue < G.column)
                        throw new Error("Section offsets must be ordered and non-overlapping.");
                    return G = J,
                    new d(s.getArg(V, "map"),S).then(ye => ({
                        generatedOffset: {
                            generatedLine: W + 1,
                            generatedColumn: ue + 1
                        },
                        consumer: ye
                    }))
                }
                )).then(V => (w._sections = V,
                w))
            }
            )
        }
        get sources() {
            const E = [];
            for (let S = 0; S < this._sections.length; S++)
                for (let w = 0; w < this._sections[S].consumer.sources.length; w++)
                    E.push(this._sections[S].consumer.sources[w]);
            return E
        }
        originalPositionFor(E) {
            const S = {
                generatedLine: s.getArg(E, "line"),
                generatedColumn: s.getArg(E, "column")
            }
              , w = a.search(S, this._sections, function(_, L) {
                const G = _.generatedLine - L.generatedOffset.generatedLine;
                return G || _.generatedColumn - (L.generatedOffset.generatedColumn - 1)
            })
              , j = this._sections[w];
            return j ? j.consumer.originalPositionFor({
                line: S.generatedLine - (j.generatedOffset.generatedLine - 1),
                column: S.generatedColumn - (j.generatedOffset.generatedLine === S.generatedLine ? j.generatedOffset.generatedColumn - 1 : 0),
                bias: E.bias
            }) : {
                source: null,
                line: null,
                column: null,
                name: null
            }
        }
        hasContentsOfAllSources() {
            return this._sections.every(function(E) {
                return E.consumer.hasContentsOfAllSources()
            })
        }
        sourceContentFor(E, S) {
            for (let w = 0; w < this._sections.length; w++) {
                const _ = this._sections[w].consumer.sourceContentFor(E, !0);
                if (_)
                    return _
            }
            if (S)
                return null;
            throw new Error('"' + E + '" is not in the SourceMap.')
        }
        _findSectionIndex(E) {
            for (let S = 0; S < this._sections.length; S++) {
                const {consumer: w} = this._sections[S];
                if (w._findSourceIndex(E) !== -1)
                    return S
            }
            return -1
        }
        generatedPositionFor(E) {
            const S = this._findSectionIndex(s.getArg(E, "source"))
              , w = S >= 0 ? this._sections[S] : null
              , j = S >= 0 && S + 1 < this._sections.length ? this._sections[S + 1] : null
              , _ = w && w.consumer.generatedPositionFor(E);
            if (_ && _.line !== null) {
                const L = w.generatedOffset.generatedLine - 1
                  , G = w.generatedOffset.generatedColumn - 1;
                return _.line === 1 && (_.column += G,
                typeof _.lastColumn == "number" && (_.lastColumn += G)),
                _.lastColumn === 1 / 0 && j && _.line === j.generatedOffset.generatedLine && (_.lastColumn = j.generatedOffset.generatedColumn - 2),
                _.line += L,
                _
            }
            return {
                line: null,
                column: null,
                lastColumn: null
            }
        }
        allGeneratedPositionsFor(E) {
            const S = this._findSectionIndex(s.getArg(E, "source"))
              , w = S >= 0 ? this._sections[S] : null
              , j = S >= 0 && S + 1 < this._sections.length ? this._sections[S + 1] : null;
            return w ? w.consumer.allGeneratedPositionsFor(E).map(_ => {
                const L = w.generatedOffset.generatedLine - 1
                  , G = w.generatedOffset.generatedColumn - 1;
                return _.line === 1 && (_.column += G,
                typeof _.lastColumn == "number" && (_.lastColumn += G)),
                _.lastColumn === 1 / 0 && j && _.line === j.generatedOffset.generatedLine && (_.lastColumn = j.generatedOffset.generatedColumn - 2),
                _.line += L,
                _
            }
            ) : []
        }
        eachMapping(E, S, w) {
            this._sections.forEach( (j, _) => {
                const L = _ + 1 < this._sections.length ? this._sections[_ + 1] : null
                  , {generatedOffset: G} = j
                  , V = G.generatedLine - 1
                  , J = G.generatedColumn - 1;
                j.consumer.eachMapping(function(W) {
                    W.generatedLine === 1 && (W.generatedColumn += J,
                    typeof W.lastGeneratedColumn == "number" && (W.lastGeneratedColumn += J)),
                    W.lastGeneratedColumn === 1 / 0 && L && W.generatedLine === L.generatedOffset.generatedLine && (W.lastGeneratedColumn = L.generatedOffset.generatedColumn - 2),
                    W.generatedLine += V,
                    E.call(this, W)
                }, S, w)
            }
            )
        }
        computeColumnSpans() {
            for (let E = 0; E < this._sections.length; E++)
                this._sections[E].consumer.computeColumnSpans()
        }
        destroy() {
            for (let E = 0; E < this._sections.length; E++)
                this._sections[E].consumer.destroy()
        }
    }
    Ya.IndexedSourceMapConsumer = g;
    function p(x, E) {
        let S = x;
        typeof x == "string" && (S = s.parseSourceMapInput(x));
        const w = S.sections != null ? new g(S,E) : new m(S,E);
        return Promise.resolve(w)
    }
    function b(x, E) {
        return m.fromSourceMap(x, E)
    }
    return Ya
}
var ho = {}, mm;
function av() {
    if (mm)
        return ho;
    mm = 1;
    const s = Ag().SourceMapGenerator
      , a = zs()
      , r = /(\r?\n)/
      , u = 10
      , c = "$$$isSourceNode$$$";
    class f {
        constructor(m, g, p, b, x) {
            this.children = [],
            this.sourceContents = {},
            this.line = m ?? null,
            this.column = g ?? null,
            this.source = p ?? null,
            this.name = x ?? null,
            this[c] = !0,
            b != null && this.add(b)
        }
        static fromStringWithSourceMap(m, g, p) {
            const b = new f
              , x = m.split(r);
            let E = 0;
            const S = function() {
                const V = W()
                  , J = W() || "";
                return V + J;
                function W() {
                    return E < x.length ? x[E++] : void 0
                }
            };
            let w = 1, j = 0, _ = null, L;
            return g.eachMapping(function(V) {
                if (_ !== null)
                    if (w < V.generatedLine)
                        G(_, S()),
                        w++,
                        j = 0;
                    else {
                        L = x[E] || "";
                        const J = L.substr(0, V.generatedColumn - j);
                        x[E] = L.substr(V.generatedColumn - j),
                        j = V.generatedColumn,
                        G(_, J),
                        _ = V;
                        return
                    }
                for (; w < V.generatedLine; )
                    b.add(S()),
                    w++;
                j < V.generatedColumn && (L = x[E] || "",
                b.add(L.substr(0, V.generatedColumn)),
                x[E] = L.substr(V.generatedColumn),
                j = V.generatedColumn),
                _ = V
            }, this),
            E < x.length && (_ && G(_, S()),
            b.add(x.splice(E).join(""))),
            g.sources.forEach(function(V) {
                const J = g.sourceContentFor(V);
                J != null && (p != null && (V = a.join(p, V)),
                b.setSourceContent(V, J))
            }),
            b;
            function G(V, J) {
                if (V === null || V.source === void 0)
                    b.add(J);
                else {
                    const W = p ? a.join(p, V.source) : V.source;
                    b.add(new f(V.originalLine,V.originalColumn,W,J,V.name))
                }
            }
        }
        add(m) {
            if (Array.isArray(m))
                m.forEach(function(g) {
                    this.add(g)
                }, this);
            else if (m[c] || typeof m == "string")
                m && this.children.push(m);
            else
                throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + m);
            return this
        }
        prepend(m) {
            if (Array.isArray(m))
                for (let g = m.length - 1; g >= 0; g--)
                    this.prepend(m[g]);
            else if (m[c] || typeof m == "string")
                this.children.unshift(m);
            else
                throw new TypeError("Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + m);
            return this
        }
        walk(m) {
            let g;
            for (let p = 0, b = this.children.length; p < b; p++)
                g = this.children[p],
                g[c] ? g.walk(m) : g !== "" && m(g, {
                    source: this.source,
                    line: this.line,
                    column: this.column,
                    name: this.name
                })
        }
        join(m) {
            let g, p;
            const b = this.children.length;
            if (b > 0) {
                for (g = [],
                p = 0; p < b - 1; p++)
                    g.push(this.children[p]),
                    g.push(m);
                g.push(this.children[p]),
                this.children = g
            }
            return this
        }
        replaceRight(m, g) {
            const p = this.children[this.children.length - 1];
            return p[c] ? p.replaceRight(m, g) : typeof p == "string" ? this.children[this.children.length - 1] = p.replace(m, g) : this.children.push("".replace(m, g)),
            this
        }
        setSourceContent(m, g) {
            this.sourceContents[a.toSetString(m)] = g
        }
        walkSourceContents(m) {
            for (let p = 0, b = this.children.length; p < b; p++)
                this.children[p][c] && this.children[p].walkSourceContents(m);
            const g = Object.keys(this.sourceContents);
            for (let p = 0, b = g.length; p < b; p++)
                m(a.fromSetString(g[p]), this.sourceContents[g[p]])
        }
        toString() {
            let m = "";
            return this.walk(function(g) {
                m += g
            }),
            m
        }
        toStringWithSourceMap(m) {
            const g = {
                code: "",
                line: 1,
                column: 0
            }
              , p = new s(m);
            let b = !1
              , x = null
              , E = null
              , S = null
              , w = null;
            return this.walk(function(j, _) {
                g.code += j,
                _.source !== null && _.line !== null && _.column !== null ? ((x !== _.source || E !== _.line || S !== _.column || w !== _.name) && p.addMapping({
                    source: _.source,
                    original: {
                        line: _.line,
                        column: _.column
                    },
                    generated: {
                        line: g.line,
                        column: g.column
                    },
                    name: _.name
                }),
                x = _.source,
                E = _.line,
                S = _.column,
                w = _.name,
                b = !0) : b && (p.addMapping({
                    generated: {
                        line: g.line,
                        column: g.column
                    }
                }),
                x = null,
                b = !1);
                for (let L = 0, G = j.length; L < G; L++)
                    j.charCodeAt(L) === u ? (g.line++,
                    g.column = 0,
                    L + 1 === G ? (x = null,
                    b = !1) : b && p.addMapping({
                        source: _.source,
                        original: {
                            line: _.line,
                            column: _.column
                        },
                        generated: {
                            line: g.line,
                            column: g.column
                        },
                        name: _.name
                    })) : g.column++
            }),
            this.walkSourceContents(function(j, _) {
                p.setSourceContent(j, _)
            }),
            {
                code: g.code,
                map: p
            }
        }
    }
    return ho.SourceNode = f,
    ho
}
var gm;
function iv() {
    return gm || (gm = 1,
    Ga.SourceMapGenerator = Ag().SourceMapGenerator,
    Ga.SourceMapConsumer = lv().SourceMapConsumer,
    Ga.SourceNode = av().SourceNode),
    Ga
}
var Ao = iv();
function sv(s, a, r) {
    const u = s[a];
    if (!u)
        return {
            lineIndex: a,
            column: r
        };
    const c = u.trim()
      , f = /^<\/[A-Za-z][A-Za-z0-9\-_.]*\s*>$/.test(c)
      , d = /<\/[A-Za-z][A-Za-z0-9\-_.]*\s*>$/.test(c);
    let m = !1;
    if (r != null) {
        const g = u.substring(0, r);
        m = /<\/[A-Za-z][A-Za-z0-9\-_.]*\s*>$/.test(g)
    }
    if (f || d || m) {
        if (r != null) {
            const g = u.substring(r)
              , p = g.match(/<([A-Za-z][A-Za-z0-9\-_.]*)/);
            if (p && g[p.index + 1] !== "/")
                return {
                    lineIndex: a,
                    column: r + p.index + 1
                }
        }
        for (let g = a + 1; g < s.length && g < a + 50; g++) {
            const p = s[g]
              , b = p.match(/<([A-Za-z][A-Za-z0-9\-_.]*)/);
            if (b && p[b.index + 1] !== "/")
                return {
                    lineIndex: g,
                    column: b.index + 1
                }
        }
    }
    return {
        lineIndex: a,
        column: r
    }
}
function Yo(s, a, r) {
    let u = 0;
    for (let c = a; c < s.length; c++) {
        const f = s[c]
          , d = c === a ? r : 0;
        for (let m = d; m < f.length; m++) {
            const g = f[m];
            if (g === "{")
                u++;
            else if (g === "}")
                u--;
            else if (u === 0) {
                if (g === "/" && f[m + 1] === ">")
                    return {
                        lineIndex: c,
                        columnEnd: m + 2,
                        isSelfClosing: !0
                    };
                if (g === ">")
                    return {
                        lineIndex: c,
                        columnEnd: m + 1,
                        isSelfClosing: !1
                    }
            }
        }
    }
}
function Mg(s, a, r, u) {
    let c = 1;
    const f = new RegExp(`<${a}(?=\\s|>|/>)`,"g")
      , d = new RegExp(`</${a}\\s*>`,"g");
    for (let m = r; m < s.length; m++) {
        const g = m === r ? u : 0
          , p = s[m].substring(g)
          , b = [];
        let x;
        for (f.lastIndex = 0; (x = f.exec(p)) !== null; ) {
            const E = Yo([p], 0, x.index + x[0].length);
            E && !E.isSelfClosing && b.push({
                type: "open",
                index: x.index,
                length: x[0].length
            })
        }
        for (d.lastIndex = 0; (x = d.exec(p)) !== null; )
            b.push({
                type: "close",
                index: x.index,
                length: x[0].length
            });
        b.sort( (E, S) => E.index - S.index);
        for (const E of b)
            if (E.type === "open")
                c++;
            else if (E.type === "close" && (c--,
            c === 0))
                return {
                    lineIndex: m,
                    columnEnd: g + E.index + E.length
                }
    }
}
function pm(s, a, r) {
    let u;
    for (let c = a; c >= 0; c--) {
        const f = s[c]
          , d = /<([A-Za-z][A-Za-z0-9\-_.]*)/g;
        let m;
        for (; (m = d.exec(f)) !== null; ) {
            const g = m.index
              , p = m[1];
            if (f[g + 1] === "/" || !(c < a || c === a && g <= (r ?? f.length)))
                continue;
            const x = g + m[0].length
              , E = Yo(s, c, x);
            if (!E)
                continue;
            let S = c
              , w = E.columnEnd;
            if (!E.isSelfClosing) {
                const _ = Mg(s, p, c, E.columnEnd);
                if (!_)
                    continue;
                S = _.lineIndex,
                w = _.columnEnd
            }
            (c < a || c === a && g <= (r ?? f.length)) && (S > a || S === a && w >= (r ?? 0)) && (!u || S - c < u.closeLineIndex - u.lineIndex || S - c === u.closeLineIndex - u.lineIndex && w - g < u.closeColumnEnd - u.columnStart) && (u = {
                tagName: p,
                lineIndex: c,
                columnStart: g,
                columnEnd: E.columnEnd,
                isSelfClosing: E.isSelfClosing,
                closeLineIndex: S,
                closeColumnEnd: w
            })
        }
    }
    return u
}
function rv(s, a, r) {
    const u = new RegExp(`<(${r})(?=\\s|>|/>)`,"i");
    for (let c = a + 1; c < s.length && c < a + 50; c++) {
        const f = s[c]
          , d = u.exec(f);
        if (d) {
            const m = d.index
              , g = d[1]
              , p = m + d[0].length
              , b = Yo(s, c, p);
            if (!b)
                continue;
            let x = c
              , E = b.columnEnd;
            if (!b.isSelfClosing) {
                const S = Mg(s, g, c, b.columnEnd);
                if (!S)
                    continue;
                x = S.lineIndex,
                E = S.columnEnd
            }
            return {
                tagName: g,
                lineIndex: c,
                columnStart: m,
                columnEnd: b.columnEnd,
                isSelfClosing: b.isSelfClosing,
                closeLineIndex: x,
                closeColumnEnd: E
            }
        }
    }
}
function uv(s, a, r, u, c) {
    if (a === u)
        return s[a].substring(r, c);
    let f = s[a].substring(r);
    for (let d = a + 1; d < u; d++)
        f += `
` + s[d];
    return f += `
` + s[u].substring(0, c),
    f
}
function ov(s, a, r=10) {
    const u = s.split(`
`)
      , c = Math.max(0, a - r - 1)
      , f = Math.min(u.length - 1, a + r - 1)
      , d = [];
    for (let m = c; m <= f; m++) {
        const g = m + 1
          , x = `${g === a ? ">>>" : "   "} ${g.toString().padStart(4, " ")} | ${u[m] || ""}`;
        d.push(x)
    }
    return d.join(`
`)
}
async function cv(s) {
    try {
        const a = await fetch(s);
        if (!a.ok)
            throw new Error(`Failed to load source map: ${a.status}`);
        return await a.json()
    } catch (a) {
        const r = a instanceof Error ? a.message : String(a);
        console.warn("Error loading source map from", s, r)
    }
}
let mo = !1;
const kl = new Map
  , fv = 300 * 1e3
  , dv = 1e3;
setInterval( () => {
    const s = Date.now();
    for (const [a,r] of kl.entries())
        s - r.timestamp > fv && kl.delete(a)
}
, 6e4);
async function hv() {
    if (!mo)
        try {
            await Ao.SourceMapConsumer.initialize({
                "lib/mappings.wasm": "https://unpkg.com/source-map@0.7.6/lib/mappings.wasm"
            }),
            mo = !0
        } catch (s) {
            console.warn("Failed to initialize SourceMapConsumer:", s);
            try {
                await Ao.SourceMapConsumer.initialize({}),
                mo = !0
            } catch (a) {
                throw console.error("SourceMapConsumer initialization failed completely:", a),
                a
            }
        }
}
function mv(s) {
    if (!s || !s.stack)
        return `no-stack-${s?.message || "unknown"}`;
    const u = s.stack.split(`
`).slice(0, 6).map(c => c.replace(/\?t=\d+/g, "").replace(/\?v=[\w\d]+/g, "").replace(/\d{13,}/g, "TIMESTAMP"));
    return `${s.name || "Error"}-${s.message}-${u.join("|")}`
}
const gv = "preview-inject/";
async function Ka(s, a=10, r) {
    if (!s || !s.stack)
        return {
            errorMessage: s?.message || "",
            mappedStack: s?.stack || "",
            sourceContext: []
        };
    const u = mv(s);
    if (kl.has(u)) {
        const x = kl.get(u);
        return console.log("Using cached error mapping for:", u),
        x
    }
    if (kl.size >= dv)
        return null;
    await hv();
    const c = s.stack.split(`
`)
      , f = []
      , d = []
      , m = new Map
      , g = new Map;
    let p = 0;
    for (const x of c) {
        const E = x.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)|at\s+(.+?):(\d+):(\d+)|([^@]*)@(.+?):(\d+):(\d+)/);
        if (!E) {
            f.push(x);
            continue
        }
        let S, w, j, _;
        E[1] ? (S = E[1],
        w = E[2],
        j = parseInt(E[3]),
        _ = parseInt(E[4])) : E[5] ? (S = "<anonymous>",
        w = E[5],
        j = parseInt(E[6]),
        _ = parseInt(E[7])) : (S = E[8],
        w = E[9],
        j = parseInt(E[10]),
        _ = parseInt(E[11]));
        try {
            const L = `${w}.map`;
            let G = m.get(L);
            if (!G) {
                const J = await cv(L);
                G = await new Ao.SourceMapConsumer(J),
                m.set(L, G)
            }
            const V = G.originalPositionFor({
                line: j,
                column: _
            });
            if (V.source) {
                if (V.source.includes(gv))
                    continue;
                const J = V.source.split("/").filter(I => I !== "..").join("/")
                  , ue = `    at ${V.name || S} (${J}:${V.line}:${V.column})`;
                if (f.push(ue),
                V.line && V.column && p < a) {
                    p++;
                    try {
                        const I = await pv(G, V.source, g);
                        if (I) {
                            const ye = J.includes("node_modules")
                              , Ce = /\.(tsx|jsx)$/.test(J);
                            let k;
                            if (!ye && Ce) {
                                const Z = yv(I, V.line, V.column, r);
                                Z && (k = {
                                    tagName: Z.tagName,
                                    code: Z.code,
                                    context: Z.context,
                                    startLine: Z.startLine,
                                    endLine: Z.endLine
                                })
                            }
                            const X = ov(I, V.line, ye ? 1 : 10);
                            d.push({
                                file: J,
                                line: V.line,
                                column: V.column,
                                context: X,
                                closedBlock: k
                            })
                        }
                    } catch (I) {
                        console.warn("Failed to extract source context:", I)
                    }
                }
            } else
                f.push(x)
        } catch (L) {
            console.warn("Failed to map stack line:", x, L),
            f.push(x)
        }
    }
    for (const x of m.values())
        x.destroy();
    const b = {
        errorMessage: s?.message || "",
        mappedStack: f.join(`
`),
        sourceContext: d
    };
    return b.timestamp = Date.now(),
    kl.set(u, b),
    b
}
async function pv(s, a, r) {
    if (r.has(a))
        return r.get(a) || null;
    const u = s.sourceContentFor(a);
    return u ? (r.set(a, u),
    u) : null
}
function yv(s, a, r, u) {
    const c = s.split(`
`);
    let f = a - 1;
    if (f < 0 || f >= c.length)
        return;
    let d = pm(c, f, r);
    if (u && d) {
        const S = u.toLowerCase()
          , w = d.tagName.toLowerCase();
        if (S !== w) {
            const j = rv(c, f, S);
            j && (d = j)
        }
    } else if (!d) {
        const S = sv(c, f, r);
        d = pm(c, S.lineIndex, S.column)
    }
    if (!d)
        return;
    const {tagName: m, lineIndex: g, columnStart: p, closeLineIndex: b, closeColumnEnd: x, isSelfClosing: E} = d;
    return {
        tagName: m,
        code: uv(c, g, p, b, x),
        context: c.slice(g, b + 1).join(`
`),
        startLine: g + 1,
        endLine: b + 1,
        isSelfClosing: E
    }
}
class vv {
    client;
    originalConsoleError;
    constructor() {
        const a = Hy();
        a.length > 0 && a.forEach(r => {
            r.type === "console.error" ? this.handleConsoleError(r.args) : r.type === "runtime" && this.handleError(r.args)
        }
        ),
        this.client = new Xl(window.parent),
        this.originalConsoleError = console.error,
        this.initErrorHandlers()
    }
    initErrorHandlers() {
        window.addEventListener("error", this.handleError.bind(this)),
        window.addEventListener("unhandledrejection", this.handlePromiseRejection.bind(this)),
        this.interceptConsoleError()
    }
    async handleError(a) {
        const r = a.target;
        if (!(r && r instanceof HTMLElement && r.tagName && ["IMG", "SCRIPT", "LINK", "VIDEO", "AUDIO", "SOURCE", "IFRAME"].includes(r.tagName)) && a.error && a.error.stack)
            try {
                const u = await Ka(a.error);
                this.sendError(u)
            } catch (u) {
                console.warn("Failed to map error stack:", u)
            }
    }
    async handlePromiseRejection(a) {
        const r = a.reason instanceof Error ? a.reason : new Error(String(a.reason));
        if (r.stack)
            try {
                const u = await Ka(r);
                this.sendError(u)
            } catch (u) {
                console.warn("Failed to map promise rejection stack:", u)
            }
    }
    interceptConsoleError() {
        console.error = (...a) => {
            this.originalConsoleError.apply(console, a);
            const r = a.find(u => u instanceof Error);
            if (r && r.stack)
                this.handleConsoleError(r);
            else if (a.length > 0) {
                const u = a.map(f => typeof f == "object" ? JSON.stringify(f) : String(f)).join(" ")
                  , c = new Error(u);
                this.handleConsoleError(c)
            }
        }
    }
    async handleConsoleError(a) {
        try {
            const r = await Ka(a);
            this.sendError(r)
        } catch (r) {
            console.warn("Failed to map console error stack:", r)
        }
    }
    reportError(a) {
        this.handleReactError(a)
    }
    async handleReactError(a) {
        try {
            const r = await Ka(a);
            this.sendError(r)
        } catch (r) {
            console.warn("Failed to map React error stack:", r)
        }
    }
    async sendError(a) {
        if (!a) {
            console.warn("error is too many");
            return
        }
        if (a.sourceContext.length !== 0)
            try {
                await this.client.post("runtime-error", a)
            } catch (r) {
                console.warn("Failed to send error to parent:", r)
            }
    }
    destroy() {
        console.error = this.originalConsoleError,
        this.client.destroy()
    }
}
function xv() {
    const s = new vv;
    return window.runtimeErrorCollector = s,
    s
}
class bv {
    _client;
    constructor() {
        this._client = new Xl(window.parent),
        this._domContentLoadedListener()
    }
    _domContentLoadedListener() {
        const a = () => {
            console.log("DOMContentLoaded"),
            this._client.post("DOMContentLoaded"),
            document.removeEventListener("DOMContentLoaded", a)
        }
        ;
        document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", a) : (console.log("DOMContentLoaded"),
        this._client.post("DOMContentLoaded"))
    }
}
function Sv() {
    return new bv
}
const Vo = s => {
    const a = "/preview/666d6117-586a-47ce-9193-541a0779ed2f/6954280";
    return s.startsWith(a) ? s.replaceAll(a, "") || "/" : s || "/"
}
  , Ev = "modulepreload"
  , wv = function(s) {
    return "/preview/666d6117-586a-47ce-9193-541a0779ed2f/6954280/" + s
}
  , ym = {}
  , Lg = function(a, r, u) {
    let c = Promise.resolve();
    if (r && r.length > 0) {
        let p = function(b) {
            return Promise.all(b.map(x => Promise.resolve(x).then(E => ({
                status: "fulfilled",
                value: E
            }), E => ({
                status: "rejected",
                reason: E
            }))))
        };
        var d = p;
        document.getElementsByTagName("link");
        const m = document.querySelector("meta[property=csp-nonce]")
          , g = m?.nonce || m?.getAttribute("nonce");
        c = p(r.map(b => {
            if (b = wv(b),
            b in ym)
                return;
            ym[b] = !0;
            const x = b.endsWith(".css")
              , E = x ? '[rel="stylesheet"]' : "";
            if (document.querySelector(`link[href="${b}"]${E}`))
                return;
            const S = document.createElement("link");
            if (S.rel = x ? "stylesheet" : Ev,
            x || (S.as = "script"),
            S.crossOrigin = "",
            S.href = b,
            g && S.setAttribute("nonce", g),
            document.head.appendChild(S),
            x)
                return new Promise( (w, j) => {
                    S.addEventListener("load", w),
                    S.addEventListener("error", () => j(new Error(`Unable to preload CSS for ${b}`)))
                }
                )
        }
        ))
    }
    function f(m) {
        const g = new Event("vite:preloadError",{
            cancelable: !0
        });
        if (g.payload = m,
        window.dispatchEvent(g),
        !g.defaultPrevented)
            throw m
    }
    return c.then(m => {
        for (const g of m || [])
            g.status === "rejected" && f(g.reason);
        return a().catch(f)
    }
    )
};
async function _v() {
    await await Lg( () => Promise.resolve().then( () => L1), []).then(a => a.navigatePromise).catch(a => (console.error(a),
    Promise.resolve( () => {}
    ))),
    window.REACT_APP_ROUTER = {
        push: (a, r) => {
            window.REACT_APP_NAVIGATE(a, r)
        }
        ,
        replace: (a, r, u) => {
            window.REACT_APP_NAVIGATE(a, {
                replace: !0,
                ...u
            })
        }
        ,
        forward: () => {
            window.REACT_APP_NAVIGATE(1)
        }
        ,
        back: () => {
            window.REACT_APP_NAVIGATE(-1)
        }
        ,
        refresh: () => {
            window.REACT_APP_NAVIGATE(0)
        }
        ,
        prefetch: (a, r) => {
            window.REACT_APP_NAVIGATE(a, r)
        }
    }
}
const zg = new Promise(s => {
    _v().then( () => {
        s(window.REACT_APP_ROUTER)
    }
    )
}
)
  , ko = () => window.REACT_APP_ROUTER
  , Qo = new Xl(window.parent)
  , Ro = async (s, a) => {
    await Qo.post("routeWillChange", {
        next: Vo(s)
    }, a)
}
;
function Cv(s) {
    const a = document.querySelector(s);
    a && a.scrollIntoView({
        behavior: "smooth"
    })
}
function Nv() {
    const s = window.open;
    return window.open = function(a, r, u) {
        return a && typeof a == "string" && a.startsWith("#") ? (Cv(a),
        null) : (s(a, "_blank", u),
        null)
    }
    ,
    () => {
        window.open = s
    }
}
function Tv() {
    const s = async a => {
        const u = a.target.closest("a");
        if (!u || u.tagName !== "A")
            return;
        const c = u.getAttribute("href");
        if (c && !["#", "javascript:void(0)", ""].includes(c) && !c.startsWith("#")) {
            if (a.preventDefault(),
            c.startsWith("/")) {
                const f = ko();
                await Ro(c, {
                    timeout: 500
                });
                const d = Vo(c);
                f.push(d);
                return
            }
            window.open(u.href, "_blank")
        }
    }
    ;
    return window.addEventListener("click", s, !0),
    () => {
        window.removeEventListener("click", s, !0)
    }
}
const vm = s => s.startsWith("http://") || s.startsWith("https://");
function jv(s) {
    return !s || typeof s != "string" ? !1 : s.indexOf("accounts.google.com") !== -1 || s.indexOf("googleapis.com/oauth") !== -1 || s.indexOf("/auth/") !== -1 && s.indexOf("provider=google") !== -1
}
function Ov() {
    const s = () => {
        const a = ko()
          , r = a.push;
        a.push = async function(c, f, d) {
            return vm(c) ? (window.open(c, "_blank"),
            Promise.resolve(!1)) : (await Ro(c, {
                timeout: 500
            }),
            r.call(this, c, f, d))
        }
        ;
        const u = a.replace;
        a.replace = async function(c, f, d) {
            return vm(c) ? (window.open(c, "_blank"),
            Promise.resolve(!1)) : (await Ro(c, {
                timeout: 500
            }),
            u.call(this, c, f, d))
        }
    }
    ;
    return window.addEventListener("load", s),
    () => {
        window.removeEventListener("load", s)
    }
}
function Av() {
    if (!("navigation"in window))
        return () => {}
        ;
    const s = a => {
        jv(a.destination.url) && Qo.post("google-auth-blocked", {
            url: a.destination.url || ""
        })
    }
    ;
    return window.navigation.addEventListener("navigate", s),
    () => {
        window.navigation.removeEventListener("navigate", s)
    }
}
async function Rv() {
    await zg;
    const s = Nv()
      , a = Tv()
      , r = Ov()
      , u = Av();
    return () => {
        Qo.destroy(),
        s(),
        a(),
        r(),
        u()
    }
}
async function Mv() {
    const s = await Lg( () => Promise.resolve().then( () => R1), void 0).then(f => f.default).catch(f => []);
    let a = []
      , r = 0;
    function u(f, d) {
        const {path: m="", children: g, index: p} = f;
        r++;
        const b = p === !0 || m === ""
          , x = m && m[0] === "/"
          , E = b ? d.path : `${d.path}/${m}`
          , S = x && !b ? m : E
          , w = {
            id: r,
            parentId: d.id,
            path: "/" + S.split("/").filter(Boolean).join("/")
        };
        /\*/.test(w.path) || a.push(w),
        g && g.forEach(j => u(j, w))
    }
    s.forEach(f => u(f, {
        id: 0,
        path: ""
    }));
    const c = new Set;
    return a = a.filter(f => c.has(f.path) ? !1 : (c.add(f.path),
    !0)),
    a
}
async function Lv() {
    const s = new Xl(window.parent)
      , a = await Mv();
    window.REACT_APP_ROUTES = a,
    s.post("routes", {
        routes: a
    }),
    s.on("getRouteInfo", async x => a),
    await zg,
    s.on("routeAction", async x => {
        const E = ko()
          , {action: S, route: w} = x;
        switch (S) {
        case "goForward":
            E.forward();
            break;
        case "goBack":
            E.back();
            break;
        case "refresh":
            E.refresh();
            break;
        case "goTo":
            w && E.push(w);
            break;
        default:
            console.warn("Unknown action:", S)
        }
    }
    );
    function r() {
        const x = window.history.state?.index ?? 0
          , E = window.history.length > x + 1
          , S = x > 0
          , w = window.location.pathname;
        s.post("updateNavigationState", {
            canGoForward: E,
            canGoBack: S,
            currentRoute: Vo(w)
        })
    }
    function u() {
        const x = new MutationObserver(S => {
            S.forEach(w => {
                (w.type === "childList" || w.type === "characterData") && s.post("titleChanged", {
                    title: document.title
                })
            }
            )
        }
        )
          , E = document.querySelector("title");
        return s.post("titleChanged", {
            title: document.title
        }),
        E && x.observe(E, {
            childList: !0,
            characterData: !0,
            subtree: !0
        }),
        x
    }
    let c = u();
    function f() {
        c.disconnect(),
        setTimeout( () => {
            c = u()
        }
        , 100)
    }
    const d = window.history.pushState
      , m = window.history.replaceState
      , g = window.history.go
      , p = window.history.back
      , b = window.history.forward;
    return window.history.pushState = function(x, E, S) {
        d.apply(this, arguments),
        r(),
        f()
    }
    ,
    window.history.replaceState = function(x, E, S) {
        m.apply(this, arguments),
        r(),
        f()
    }
    ,
    window.history.go = function(x) {
        g.apply(this, arguments),
        setTimeout( () => {
            r(),
            f()
        }
        , 100)
    }
    ,
    window.history.back = function() {
        p.apply(this, arguments),
        setTimeout( () => {
            r(),
            f()
        }
        , 100)
    }
    ,
    window.history.forward = function() {
        b.apply(this, arguments),
        setTimeout( () => {
            r(),
            f()
        }
        , 100)
    }
    ,
    {
        destroy: () => {
            s.destroy(),
            c.disconnect()
        }
    }
}
var go = {
    exports: {}
}
  , ie = {};
var xm;
function zv() {
    if (xm)
        return ie;
    xm = 1;
    var s = Symbol.for("react.transitional.element")
      , a = Symbol.for("react.portal")
      , r = Symbol.for("react.fragment")
      , u = Symbol.for("react.strict_mode")
      , c = Symbol.for("react.profiler")
      , f = Symbol.for("react.consumer")
      , d = Symbol.for("react.context")
      , m = Symbol.for("react.forward_ref")
      , g = Symbol.for("react.suspense")
      , p = Symbol.for("react.memo")
      , b = Symbol.for("react.lazy")
      , x = Symbol.for("react.activity")
      , E = Symbol.iterator;
    function S(N) {
        return N === null || typeof N != "object" ? null : (N = E && N[E] || N["@@iterator"],
        typeof N == "function" ? N : null)
    }
    var w = {
        isMounted: function() {
            return !1
        },
        enqueueForceUpdate: function() {},
        enqueueReplaceState: function() {},
        enqueueSetState: function() {}
    }
      , j = Object.assign
      , _ = {};
    function L(N, B, K) {
        this.props = N,
        this.context = B,
        this.refs = _,
        this.updater = K || w
    }
    L.prototype.isReactComponent = {},
    L.prototype.setState = function(N, B) {
        if (typeof N != "object" && typeof N != "function" && N != null)
            throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
        this.updater.enqueueSetState(this, N, B, "setState")
    }
    ,
    L.prototype.forceUpdate = function(N) {
        this.updater.enqueueForceUpdate(this, N, "forceUpdate")
    }
    ;
    function G() {}
    G.prototype = L.prototype;
    function V(N, B, K) {
        this.props = N,
        this.context = B,
        this.refs = _,
        this.updater = K || w
    }
    var J = V.prototype = new G;
    J.constructor = V,
    j(J, L.prototype),
    J.isPureReactComponent = !0;
    var W = Array.isArray;
    function ue() {}
    var I = {
        H: null,
        A: null,
        T: null,
        S: null
    }
      , ye = Object.prototype.hasOwnProperty;
    function Ce(N, B, K) {
        var $ = K.ref;
        return {
            $$typeof: s,
            type: N,
            key: B,
            ref: $ !== void 0 ? $ : null,
            props: K
        }
    }
    function k(N, B) {
        return Ce(N.type, B, N.props)
    }
    function X(N) {
        return typeof N == "object" && N !== null && N.$$typeof === s
    }
    function Z(N) {
        var B = {
            "=": "=0",
            ":": "=2"
        };
        return "$" + N.replace(/[=:]/g, function(K) {
            return B[K]
        })
    }
    var ne = /\/+/g;
    function oe(N, B) {
        return typeof N == "object" && N !== null && N.key != null ? Z("" + N.key) : B.toString(36)
    }
    function fe(N) {
        switch (N.status) {
        case "fulfilled":
            return N.value;
        case "rejected":
            throw N.reason;
        default:
            switch (typeof N.status == "string" ? N.then(ue, ue) : (N.status = "pending",
            N.then(function(B) {
                N.status === "pending" && (N.status = "fulfilled",
                N.value = B)
            }, function(B) {
                N.status === "pending" && (N.status = "rejected",
                N.reason = B)
            })),
            N.status) {
            case "fulfilled":
                return N.value;
            case "rejected":
                throw N.reason
            }
        }
        throw N
    }
    function D(N, B, K, $, se) {
        var de = typeof N;
        (de === "undefined" || de === "boolean") && (N = null);
        var _e = !1;
        if (N === null)
            _e = !0;
        else
            switch (de) {
            case "bigint":
            case "string":
            case "number":
                _e = !0;
                break;
            case "object":
                switch (N.$$typeof) {
                case s:
                case a:
                    _e = !0;
                    break;
                case b:
                    return _e = N._init,
                    D(_e(N._payload), B, K, $, se)
                }
            }
        if (_e)
            return se = se(N),
            _e = $ === "" ? "." + oe(N, 0) : $,
            W(se) ? (K = "",
            _e != null && (K = _e.replace(ne, "$&/") + "/"),
            D(se, B, K, "", function(Zl) {
                return Zl
            })) : se != null && (X(se) && (se = k(se, K + (se.key == null || N && N.key === se.key ? "" : ("" + se.key).replace(ne, "$&/") + "/") + _e)),
            B.push(se)),
            1;
        _e = 0;
        var nt = $ === "" ? "." : $ + ":";
        if (W(N))
            for (var He = 0; He < N.length; He++)
                $ = N[He],
                de = nt + oe($, He),
                _e += D($, B, K, de, se);
        else if (He = S(N),
        typeof He == "function")
            for (N = He.call(N),
            He = 0; !($ = N.next()).done; )
                $ = $.value,
                de = nt + oe($, He++),
                _e += D($, B, K, de, se);
        else if (de === "object") {
            if (typeof N.then == "function")
                return D(fe(N), B, K, $, se);
            throw B = String(N),
            Error("Objects are not valid as a React child (found: " + (B === "[object Object]" ? "object with keys {" + Object.keys(N).join(", ") + "}" : B) + "). If you meant to render a collection of children, use an array instead.")
        }
        return _e
    }
    function Q(N, B, K) {
        if (N == null)
            return N;
        var $ = []
          , se = 0;
        return D(N, $, "", "", function(de) {
            return B.call(K, de, se++)
        }),
        $
    }
    function te(N) {
        if (N._status === -1) {
            var B = N._result;
            B = B(),
            B.then(function(K) {
                (N._status === 0 || N._status === -1) && (N._status = 1,
                N._result = K)
            }, function(K) {
                (N._status === 0 || N._status === -1) && (N._status = 2,
                N._result = K)
            }),
            N._status === -1 && (N._status = 0,
            N._result = B)
        }
        if (N._status === 1)
            return N._result.default;
        throw N._result
    }
    var xe = typeof reportError == "function" ? reportError : function(N) {
        if (typeof window == "object" && typeof window.ErrorEvent == "function") {
            var B = new window.ErrorEvent("error",{
                bubbles: !0,
                cancelable: !0,
                message: typeof N == "object" && N !== null && typeof N.message == "string" ? String(N.message) : String(N),
                error: N
            });
            if (!window.dispatchEvent(B))
                return
        } else if (typeof process == "object" && typeof process.emit == "function") {
            process.emit("uncaughtException", N);
            return
        }
        console.error(N)
    }
      , we = {
        map: Q,
        forEach: function(N, B, K) {
            Q(N, function() {
                B.apply(this, arguments)
            }, K)
        },
        count: function(N) {
            var B = 0;
            return Q(N, function() {
                B++
            }),
            B
        },
        toArray: function(N) {
            return Q(N, function(B) {
                return B
            }) || []
        },
        only: function(N) {
            if (!X(N))
                throw Error("React.Children.only expected to receive a single React element child.");
            return N
        }
    };
    return ie.Activity = x,
    ie.Children = we,
    ie.Component = L,
    ie.Fragment = r,
    ie.Profiler = c,
    ie.PureComponent = V,
    ie.StrictMode = u,
    ie.Suspense = g,
    ie.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = I,
    ie.__COMPILER_RUNTIME = {
        __proto__: null,
        c: function(N) {
            return I.H.useMemoCache(N)
        }
    },
    ie.cache = function(N) {
        return function() {
            return N.apply(null, arguments)
        }
    }
    ,
    ie.cacheSignal = function() {
        return null
    }
    ,
    ie.cloneElement = function(N, B, K) {
        if (N == null)
            throw Error("The argument must be a React element, but you passed " + N + ".");
        var $ = j({}, N.props)
          , se = N.key;
        if (B != null)
            for (de in B.key !== void 0 && (se = "" + B.key),
            B)
                !ye.call(B, de) || de === "key" || de === "__self" || de === "__source" || de === "ref" && B.ref === void 0 || ($[de] = B[de]);
        var de = arguments.length - 2;
        if (de === 1)
            $.children = K;
        else if (1 < de) {
            for (var _e = Array(de), nt = 0; nt < de; nt++)
                _e[nt] = arguments[nt + 2];
            $.children = _e
        }
        return Ce(N.type, se, $)
    }
    ,
    ie.createContext = function(N) {
        return N = {
            $$typeof: d,
            _currentValue: N,
            _currentValue2: N,
            _threadCount: 0,
            Provider: null,
            Consumer: null
        },
        N.Provider = N,
        N.Consumer = {
            $$typeof: f,
            _context: N
        },
        N
    }
    ,
    ie.createElement = function(N, B, K) {
        var $, se = {}, de = null;
        if (B != null)
            for ($ in B.key !== void 0 && (de = "" + B.key),
            B)
                ye.call(B, $) && $ !== "key" && $ !== "__self" && $ !== "__source" && (se[$] = B[$]);
        var _e = arguments.length - 2;
        if (_e === 1)
            se.children = K;
        else if (1 < _e) {
            for (var nt = Array(_e), He = 0; He < _e; He++)
                nt[He] = arguments[He + 2];
            se.children = nt
        }
        if (N && N.defaultProps)
            for ($ in _e = N.defaultProps,
            _e)
                se[$] === void 0 && (se[$] = _e[$]);
        return Ce(N, de, se)
    }
    ,
    ie.createRef = function() {
        return {
            current: null
        }
    }
    ,
    ie.forwardRef = function(N) {
        return {
            $$typeof: m,
            render: N
        }
    }
    ,
    ie.isValidElement = X,
    ie.lazy = function(N) {
        return {
            $$typeof: b,
            _payload: {
                _status: -1,
                _result: N
            },
            _init: te
        }
    }
    ,
    ie.memo = function(N, B) {
        return {
            $$typeof: p,
            type: N,
            compare: B === void 0 ? null : B
        }
    }
    ,
    ie.startTransition = function(N) {
        var B = I.T
          , K = {};
        I.T = K;
        try {
            var $ = N()
              , se = I.S;
            se !== null && se(K, $),
            typeof $ == "object" && $ !== null && typeof $.then == "function" && $.then(ue, xe)
        } catch (de) {
            xe(de)
        } finally {
            B !== null && K.types !== null && (B.types = K.types),
            I.T = B
        }
    }
    ,
    ie.unstable_useCacheRefresh = function() {
        return I.H.useCacheRefresh()
    }
    ,
    ie.use = function(N) {
        return I.H.use(N)
    }
    ,
    ie.useActionState = function(N, B, K) {
        return I.H.useActionState(N, B, K)
    }
    ,
    ie.useCallback = function(N, B) {
        return I.H.useCallback(N, B)
    }
    ,
    ie.useContext = function(N) {
        return I.H.useContext(N)
    }
    ,
    ie.useDebugValue = function() {}
    ,
    ie.useDeferredValue = function(N, B) {
        return I.H.useDeferredValue(N, B)
    }
    ,
    ie.useEffect = function(N, B) {
        return I.H.useEffect(N, B)
    }
    ,
    ie.useEffectEvent = function(N) {
        return I.H.useEffectEvent(N)
    }
    ,
    ie.useId = function() {
        return I.H.useId()
    }
    ,
    ie.useImperativeHandle = function(N, B, K) {
        return I.H.useImperativeHandle(N, B, K)
    }
    ,
    ie.useInsertionEffect = function(N, B) {
        return I.H.useInsertionEffect(N, B)
    }
    ,
    ie.useLayoutEffect = function(N, B) {
        return I.H.useLayoutEffect(N, B)
    }
    ,
    ie.useMemo = function(N, B) {
        return I.H.useMemo(N, B)
    }
    ,
    ie.useOptimistic = function(N, B) {
        return I.H.useOptimistic(N, B)
    }
    ,
    ie.useReducer = function(N, B, K) {
        return I.H.useReducer(N, B, K)
    }
    ,
    ie.useRef = function(N) {
        return I.H.useRef(N)
    }
    ,
    ie.useState = function(N) {
        return I.H.useState(N)
    }
    ,
    ie.useSyncExternalStore = function(N, B, K) {
        return I.H.useSyncExternalStore(N, B, K)
    }
    ,
    ie.useTransition = function() {
        return I.H.useTransition()
    }
    ,
    ie.version = "19.2.4",
    ie
}
var bm;
function Xo() {
    return bm || (bm = 1,
    go.exports = zv()),
    go.exports
}
var H = Xo();
const Sm = Zy(H);
var po = {
    exports: {}
}
  , Va = {};
var Em;
function Dv() {
    if (Em)
        return Va;
    Em = 1;
    var s = Symbol.for("react.transitional.element")
      , a = Symbol.for("react.fragment");
    function r(u, c, f) {
        var d = null;
        if (f !== void 0 && (d = "" + f),
        c.key !== void 0 && (d = "" + c.key),
        "key"in c) {
            f = {};
            for (var m in c)
                m !== "key" && (f[m] = c[m])
        } else
            f = c;
        return c = f.ref,
        {
            $$typeof: s,
            type: u,
            key: d,
            ref: c !== void 0 ? c : null,
            props: f
        }
    }
    return Va.Fragment = a,
    Va.jsx = r,
    Va.jsxs = r,
    Va
}
var wm;
function Uv() {
    return wm || (wm = 1,
    po.exports = Dv()),
    po.exports
}
var y = Uv()
  , yo = {
    exports: {}
}
  , Es = {};
var _m;
function Hv() {
    if (_m)
        return Es;
    _m = 1;
    var s = Symbol.for("react.fragment");
    return Es.Fragment = s,
    Es.jsxDEV = void 0,
    Es
}
var Cm;
function Bv() {
    return Cm || (Cm = 1,
    yo.exports = Hv()),
    yo.exports
}
var Nm = Bv();
class Dg {
    static getFiberFromDOMNode(a) {
        if (!a)
            return null;
        const r = Object.keys(a).find(u => u.startsWith("__reactFiber$") || u.startsWith("__reactInternalInstance$"));
        return r ? a[r] : null
    }
}
const Ug = new WeakMap
  , Hg = new WeakMap
  , Tm = new WeakMap
  , vo = new WeakMap
  , jm = new WeakMap
  , Om = new WeakMap
  , xo = (s, a) => {
    try {
        Hg.set(s, a);
        const r = Dg.getFiberFromDOMNode(s);
        r && Ug.set(r, a)
    } catch {}
}
  , ws = (s, a) => {
    if (!s)
        return r => {
            r instanceof HTMLElement && xo(r, a)
        }
        ;
    if (typeof s == "function") {
        let r = vo.get(s);
        r || (r = [],
        vo.set(s, r)),
        r.push(a);
        let u = Tm.get(s);
        return u || (u = c => {
            if (c instanceof HTMLElement) {
                const f = vo.get(s);
                if (f && f.length > 0) {
                    const d = f.shift();
                    xo(c, d)
                }
            }
            s(c)
        }
        ,
        Tm.set(s, u)),
        u
    }
    if (s && typeof s == "object" && "current"in s) {
        Om.set(s, a);
        let r = jm.get(s);
        return r || (r = u => {
            if (u instanceof HTMLElement) {
                const c = Om.get(s);
                c && xo(u, c)
            }
            s.current = u
        }
        ,
        jm.set(s, r)),
        r
    }
}
;
function qv() {
    const s = Sm.createElement
      , a = y.jsx
      , r = y.jsxs
      , u = Nm.jsxDEV
      , c = () => {
        const d = new Error;
        return () => d
    }
      , f = d => typeof d == "string";
    Sm.createElement = function(d, m, ...g) {
        if (!f(d) && typeof d != "function")
            return s(d, m, ...g);
        const p = c()
          , b = m ? {
            ...m
        } : {}
          , x = ws(b.ref, p);
        return x && (b.ref = x),
        s(d, b, ...g)
    }
    ,
    y.jsx = function(d, m, g) {
        if (!f(d) && typeof d != "function")
            return a(d, m, g);
        const p = c()
          , b = m ? {
            ...m
        } : {}
          , x = ws(b.ref, p);
        return x && (b.ref = x),
        a(d, b, g)
    }
    ,
    y.jsxs = function(d, m, g) {
        if (!f(d) && typeof d != "function")
            return r(d, m, g);
        const p = c()
          , b = m ? {
            ...m
        } : {}
          , x = ws(b.ref, p);
        return x && (b.ref = x),
        r(d, b, g)
    }
    ,
    u && (Nm.jsxDEV = function(d, m, g, p, b, x) {
        if (!f(d) && typeof d != "function")
            return u(d, m, g, p, b, x);
        const E = c()
          , S = m ? {
            ...m
        } : {}
          , w = ws(S.ref, E);
        return w && (S.ref = w),
        u(d, S, g, p, b, x)
    }
    )
}
function Gv(s) {
    const a = document.querySelector(s);
    if (!a)
        return null;
    const r = a.tagName.toLowerCase()
      , u = Hg.get(a);
    if (u)
        return {
            element: a,
            tagName: r,
            debugError: u()
        };
    const c = Dg.getFiberFromDOMNode(a);
    if (c) {
        const f = Ug.get(c);
        if (f)
            return {
                element: a,
                tagName: r,
                debugError: f()
            }
    }
    return null
}
qv();
function Yv() {
    const s = new WeakMap
      , a = new Xl(window.parent);
    return a.on("get-element-source", async ({selector: r}) => {
        const u = Gv(r);
        if (!u)
            return null;
        const {element: c, tagName: f, debugError: d} = u;
        if (s.has(c))
            return s.get(c);
        const m = await Ka(d, 10, f);
        if (!m)
            return null;
        const p = {
            ...m.sourceContext.filter(b => !b.file.includes("node_modules"))[0],
            domInfo: {
                tagName: c.tagName,
                textContent: c.textContent.slice(0, 300)
            }
        };
        return s.set(c, p),
        p
    }
    ),
    () => {
        a.destroy()
    }
}
const Vv = !0;
console.log("Is preview build:", Vv);
async function kv() {
    Ky(),
    xv(),
    Rv(),
    Sv(),
    Lv(),
    Yv()
}
kv();
const Qv = "phc_V7JMHB0fVJGRu8UHyrsj6pSL1BS76P5zD8qCi7lrTTV"
  , Je = {
    colors: {
        text: "#5D5D5D",
        white: "#FFFFFF",
        border: "rgba(0, 10, 36, 0.08)"
    },
    font: {
        family: '"Geist"',
        weight: "600",
        size: {
            normal: "14px",
            button: "18px"
        },
        lineHeight: "20px"
    },
    button: {
        gradient: "linear-gradient(180deg, #A797FF 0%, #7057FF 100%)"
    },
    shadow: "0px 8px 12px 0px rgba(9, 10, 20, 0.06)",
    zIndex: `${Number.MAX_SAFE_INTEGER}`
}
  , Am = {
    close: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2D303D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>')}`,
    generate: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" fill="none" width="16" height="16" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M4.87 4.94c.227-.71 1.21-.723 1.456-.02l1.177 3.378 3.101 1.013c.708.231.714 1.216.01 1.455l-3.183 1.082-1.105 3.17c-.245.704-1.23.69-1.455-.02l-.989-3.107-3.367-1.203c-.702-.25-.68-1.234.04-1.455l3.282-1.016 1.043-3.277Z" fill="#FFF"/><path fill-rule="evenodd" d="M12.238 1.3c.167-.667 1.1-.667 1.266 0l.388 1.551 1.55.388c.666.166.667 1.1 0 1.266l-1.55.388-.388 1.55c-.167.666-1.1.667-1.266 0l-.388-1.55-1.55-.388c-.667-.166-.667-1.1 0-1.266l1.55-.388.388-1.551Z" fill="#FFF"/></svg>')}`
}
  , Za = {
    readdyLogo: "https://public.readdy.ai/gen_page/readdy-logo.png",
    watermarkLogo: "https://public.readdy.ai/gen_page/watermark.png",
    readdyLink: "https://readdy.ai?ref=b",
    fontStylesheet: "https://fonts.googleapis.com/css2?family=Geist:wght@600&display=swap",
    posthogCDN: "https://cdn.jsdelivr.net/npm/posthog-js@1.96.1/dist/array.full.min.js"
}
  , Rm = {
    en: {
        prefix: "This Website is Made with",
        suffix: ". You can also get one like this in minutes",
        button: "Get one for FREE"
    },
    zh: {
        prefix: "本网站来自",
        suffix: "你也可以在几分钟内拥有同样的页面",
        button: "立即免费拥有"
    }
}
  , Xv = () => navigator.language?.toLowerCase().startsWith("zh") ?? !1
  , bo = () => Xv() ? Rm.zh : Rm.en
  , Kv = () => window.innerWidth > 768 && !("ontouchstart"in window)
  , Zv = () => {
    const s = window.location.hostname;
    return ["readdy.ai", "dev.readdy.ai", "localhost"].some(r => s === r || s.endsWith(`.${r}`))
}
;
function Jv() {
    if (window.posthog)
        return;
    const s = document.createElement("script");
    s.src = Za.posthogCDN,
    s.async = !0,
    s.onload = () => {
        window.posthog?.init(Qv, {
            api_host: "https://us.i.posthog.com",
            autocapture: !1,
            capture_pageview: !1,
            capture_pageleave: !1,
            disable_session_recording: !0,
            disable_scroll_properties: !0,
            capture_performance: {
                web_vitals: !1
            },
            rageclick: !1,
            loaded: function(a) {
                a.sessionRecording && a.sessionRecording.stopRecording()
            }
        })
    }
    ,
    document.head.appendChild(s)
}
function Mm(s, a) {
    window.posthog?.capture(s, {
        ...a,
        version: 2
    })
}
function Gt(s, a) {
    Object.assign(s.style, a)
}
function So(s, a="0") {
    Gt(s, {
        color: Je.colors.text,
        fontFamily: Je.font.family,
        fontSize: Je.font.size.normal,
        lineHeight: Je.font.lineHeight,
        fontWeight: Je.font.weight,
        whiteSpace: "nowrap",
        marginRight: a
    })
}
function _s(s, a="row") {
    Gt(s, {
        display: "flex",
        flexDirection: a,
        alignItems: "center",
        justifyContent: "center"
    })
}
function $v() {
    if (Zv())
        return;
    const s = "https://readdy.ai/api/public/user/is_free"
      , a = "666d6117-586a-47ce-9193-541a0779ed2f";
    async function r(S) {
        try {
            return !(await (await fetch(`${s}?projectId=${S}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            })).json()).data.is_free
        } catch {
            return !0
        }
    }
    function u() {
        document.querySelector('link[rel="icon"]')?.remove();
        const S = document.createElement("link");
        S.type = "image/png",
        S.rel = "icon",
        S.href = Za.readdyLogo,
        document.head.appendChild(S);
        const w = document.createElement("link");
        w.rel = "stylesheet",
        w.href = Za.fontStylesheet,
        document.head.appendChild(w)
    }
    function c(S) {
        Mm(S),
        window.open(Za.readdyLink, "_blank")
    }
    function f() {
        const S = document.createElement("div");
        S.id = "close-button",
        Gt(S, {
            position: "absolute",
            top: "-12px",
            right: "-12px",
            width: "32px",
            height: "32px",
            backgroundColor: Je.colors.white,
            borderRadius: "50%",
            borderStyle: "solid",
            borderWidth: "1px",
            borderColor: Je.colors.border,
            cursor: "pointer",
            boxShadow: Je.shadow
        }),
        _s(S);
        const w = document.createElement("img");
        return w.src = Am.close,
        Gt(w, {
            width: "24px",
            height: "24px"
        }),
        S.appendChild(w),
        S.addEventListener("click", j => {
            j.stopPropagation(),
            Mm("watermark_close_button_click"),
            document.getElementById("watermark")?.remove()
        }
        ),
        S
    }
    function d(S) {
        const w = document.createElement("div");
        w.id = "generate-button",
        Gt(w, {
            padding: S ? "8px 16px" : "10px 20px",
            background: Je.button.gradient,
            borderRadius: "999px",
            border: "none",
            gap: "6px",
            cursor: "pointer",
            marginLeft: S ? "12px" : "0",
            whiteSpace: "nowrap",
            width: S ? "auto" : "100%"
        }),
        _s(w);
        const j = document.createElement("img");
        j.src = Am.generate,
        Gt(j, {
            width: "16px",
            height: "16px",
            flexShrink: "0"
        });
        const _ = document.createElement("span");
        return _.textContent = bo().button,
        Gt(_, {
            color: Je.colors.white,
            fontFamily: Je.font.family,
            fontSize: Je.font.size.button,
            fontWeight: Je.font.weight,
            lineHeight: Je.font.lineHeight
        }),
        w.append(j, _),
        w.addEventListener("click", L => {
            L.stopPropagation(),
            c("watermark_create_button_click")
        }
        ),
        w
    }
    function m() {
        const S = document.createElement("img");
        return S.src = Za.watermarkLogo,
        Gt(S, {
            width: "92px",
            height: "auto",
            paddingLeft: "8px",
            flexShrink: "0"
        }),
        S
    }
    function g(S) {
        const w = bo()
          , j = document.createElement("div");
        j.textContent = w.prefix,
        So(j);
        const _ = m()
          , L = document.createElement("div");
        L.textContent = w.suffix,
        So(L, "12px"),
        S.append(j, _, L, d(!0))
    }
    function p(S, w) {
        const j = document.createElement("div");
        return j.textContent = S,
        So(j),
        w && Gt(j, w),
        j
    }
    function b(S) {
        const {prefix: w, suffix: j} = bo()
          , [_,L] = j.startsWith(".") ? [".", j.slice(1).trim()] : ["", j]
          , G = document.createElement("div");
        _s(G),
        G.style.marginBottom = "4px",
        G.append(p(w, {
            marginRight: "6px"
        }), m(), ..._ ? [p(_)] : []),
        S.append(G, p(L, {
            textAlign: "center",
            marginBottom: "12px"
        }), d(!1))
    }
    function x() {
        const S = Kv()
          , w = document.createElement("div");
        return w.id = "watermark",
        Gt(w, {
            zIndex: Je.zIndex,
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            width: S ? "fit-content" : "calc(100% - 32px)",
            maxWidth: S ? "none" : "100%",
            backgroundColor: Je.colors.white,
            borderStyle: "solid",
            borderWidth: "1px",
            borderRadius: S ? "999px" : "36px",
            borderColor: Je.colors.border,
            padding: S ? "12px 20px" : "16px",
            boxShadow: Je.shadow,
            cursor: "pointer"
        }),
        _s(w, S ? "row" : "column"),
        w.appendChild(f()),
        S ? g(w) : b(w),
        w.addEventListener("click", j => {
            j.target.closest("#generate-button, #close-button") || c("watermark_create_button_click")
        }
        ),
        w
    }
    function E(S) {
        const w = document.getElementById("watermark");
        !w && !S ? (document.body.appendChild(x()),
        u(),
        Jv()) : S && w && w.remove()
    }
    r(a).then(E)
}
$v();
const ae = s => typeof s == "string"
  , ka = () => {
    let s, a;
    const r = new Promise( (u, c) => {
        s = u,
        a = c
    }
    );
    return r.resolve = s,
    r.reject = a,
    r
}
  , Lm = s => s == null ? "" : "" + s
  , Fv = (s, a, r) => {
    s.forEach(u => {
        a[u] && (r[u] = a[u])
    }
    )
}
  , Wv = /###/g
  , zm = s => s && s.indexOf("###") > -1 ? s.replace(Wv, ".") : s
  , Dm = s => !s || ae(s)
  , $a = (s, a, r) => {
    const u = ae(a) ? a.split(".") : a;
    let c = 0;
    for (; c < u.length - 1; ) {
        if (Dm(s))
            return {};
        const f = zm(u[c]);
        !s[f] && r && (s[f] = new r),
        Object.prototype.hasOwnProperty.call(s, f) ? s = s[f] : s = {},
        ++c
    }
    return Dm(s) ? {} : {
        obj: s,
        k: zm(u[c])
    }
}
  , Um = (s, a, r) => {
    const {obj: u, k: c} = $a(s, a, Object);
    if (u !== void 0 || a.length === 1) {
        u[c] = r;
        return
    }
    let f = a[a.length - 1]
      , d = a.slice(0, a.length - 1)
      , m = $a(s, d, Object);
    for (; m.obj === void 0 && d.length; )
        f = `${d[d.length - 1]}.${f}`,
        d = d.slice(0, d.length - 1),
        m = $a(s, d, Object),
        m?.obj && typeof m.obj[`${m.k}.${f}`] < "u" && (m.obj = void 0);
    m.obj[`${m.k}.${f}`] = r
}
  , Iv = (s, a, r, u) => {
    const {obj: c, k: f} = $a(s, a, Object);
    c[f] = c[f] || [],
    c[f].push(r)
}
  , As = (s, a) => {
    const {obj: r, k: u} = $a(s, a);
    if (r && Object.prototype.hasOwnProperty.call(r, u))
        return r[u]
}
  , Pv = (s, a, r) => {
    const u = As(s, r);
    return u !== void 0 ? u : As(a, r)
}
  , Bg = (s, a, r) => {
    for (const u in a)
        u !== "__proto__" && u !== "constructor" && (u in s ? ae(s[u]) || s[u]instanceof String || ae(a[u]) || a[u]instanceof String ? r && (s[u] = a[u]) : Bg(s[u], a[u], r) : s[u] = a[u]);
    return s
}
  , Gl = s => s.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
var ex = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;"
};
const tx = s => ae(s) ? s.replace(/[&<>"'\/]/g, a => ex[a]) : s;
class nx {
    constructor(a) {
        this.capacity = a,
        this.regExpMap = new Map,
        this.regExpQueue = []
    }
    getRegExp(a) {
        const r = this.regExpMap.get(a);
        if (r !== void 0)
            return r;
        const u = new RegExp(a);
        return this.regExpQueue.length === this.capacity && this.regExpMap.delete(this.regExpQueue.shift()),
        this.regExpMap.set(a, u),
        this.regExpQueue.push(a),
        u
    }
}
const lx = [" ", ",", "?", "!", ";"]
  , ax = new nx(20)
  , ix = (s, a, r) => {
    a = a || "",
    r = r || "";
    const u = lx.filter(d => a.indexOf(d) < 0 && r.indexOf(d) < 0);
    if (u.length === 0)
        return !0;
    const c = ax.getRegExp(`(${u.map(d => d === "?" ? "\\?" : d).join("|")})`);
    let f = !c.test(s);
    if (!f) {
        const d = s.indexOf(r);
        d > 0 && !c.test(s.substring(0, d)) && (f = !0)
    }
    return f
}
  , Mo = (s, a, r=".") => {
    if (!s)
        return;
    if (s[a])
        return Object.prototype.hasOwnProperty.call(s, a) ? s[a] : void 0;
    const u = a.split(r);
    let c = s;
    for (let f = 0; f < u.length; ) {
        if (!c || typeof c != "object")
            return;
        let d, m = "";
        for (let g = f; g < u.length; ++g)
            if (g !== f && (m += r),
            m += u[g],
            d = c[m],
            d !== void 0) {
                if (["string", "number", "boolean"].indexOf(typeof d) > -1 && g < u.length - 1)
                    continue;
                f += g - f + 1;
                break
            }
        c = d
    }
    return c
}
  , Fa = s => s?.replace("_", "-")
  , sx = {
    type: "logger",
    log(s) {
        this.output("log", s)
    },
    warn(s) {
        this.output("warn", s)
    },
    error(s) {
        this.output("error", s)
    },
    output(s, a) {
        console?.[s]?.apply?.(console, a)
    }
};
class Rs {
    constructor(a, r={}) {
        this.init(a, r)
    }
    init(a, r={}) {
        this.prefix = r.prefix || "i18next:",
        this.logger = a || sx,
        this.options = r,
        this.debug = r.debug
    }
    log(...a) {
        return this.forward(a, "log", "", !0)
    }
    warn(...a) {
        return this.forward(a, "warn", "", !0)
    }
    error(...a) {
        return this.forward(a, "error", "")
    }
    deprecate(...a) {
        return this.forward(a, "warn", "WARNING DEPRECATED: ", !0)
    }
    forward(a, r, u, c) {
        return c && !this.debug ? null : (ae(a[0]) && (a[0] = `${u}${this.prefix} ${a[0]}`),
        this.logger[r](a))
    }
    create(a) {
        return new Rs(this.logger,{
            prefix: `${this.prefix}:${a}:`,
            ...this.options
        })
    }
    clone(a) {
        return a = a || this.options,
        a.prefix = a.prefix || this.prefix,
        new Rs(this.logger,a)
    }
}
var Yt = new Rs;
class Ds {
    constructor() {
        this.observers = {}
    }
    on(a, r) {
        return a.split(" ").forEach(u => {
            this.observers[u] || (this.observers[u] = new Map);
            const c = this.observers[u].get(r) || 0;
            this.observers[u].set(r, c + 1)
        }
        ),
        this
    }
    off(a, r) {
        if (this.observers[a]) {
            if (!r) {
                delete this.observers[a];
                return
            }
            this.observers[a].delete(r)
        }
    }
    emit(a, ...r) {
        this.observers[a] && Array.from(this.observers[a].entries()).forEach( ([c,f]) => {
            for (let d = 0; d < f; d++)
                c(...r)
        }
        ),
        this.observers["*"] && Array.from(this.observers["*"].entries()).forEach( ([c,f]) => {
            for (let d = 0; d < f; d++)
                c.apply(c, [a, ...r])
        }
        )
    }
}
class Hm extends Ds {
    constructor(a, r={
        ns: ["translation"],
        defaultNS: "translation"
    }) {
        super(),
        this.data = a || {},
        this.options = r,
        this.options.keySeparator === void 0 && (this.options.keySeparator = "."),
        this.options.ignoreJSONStructure === void 0 && (this.options.ignoreJSONStructure = !0)
    }
    addNamespaces(a) {
        this.options.ns.indexOf(a) < 0 && this.options.ns.push(a)
    }
    removeNamespaces(a) {
        const r = this.options.ns.indexOf(a);
        r > -1 && this.options.ns.splice(r, 1)
    }
    getResource(a, r, u, c={}) {
        const f = c.keySeparator !== void 0 ? c.keySeparator : this.options.keySeparator
          , d = c.ignoreJSONStructure !== void 0 ? c.ignoreJSONStructure : this.options.ignoreJSONStructure;
        let m;
        a.indexOf(".") > -1 ? m = a.split(".") : (m = [a, r],
        u && (Array.isArray(u) ? m.push(...u) : ae(u) && f ? m.push(...u.split(f)) : m.push(u)));
        const g = As(this.data, m);
        return !g && !r && !u && a.indexOf(".") > -1 && (a = m[0],
        r = m[1],
        u = m.slice(2).join(".")),
        g || !d || !ae(u) ? g : Mo(this.data?.[a]?.[r], u, f)
    }
    addResource(a, r, u, c, f={
        silent: !1
    }) {
        const d = f.keySeparator !== void 0 ? f.keySeparator : this.options.keySeparator;
        let m = [a, r];
        u && (m = m.concat(d ? u.split(d) : u)),
        a.indexOf(".") > -1 && (m = a.split("."),
        c = r,
        r = m[1]),
        this.addNamespaces(r),
        Um(this.data, m, c),
        f.silent || this.emit("added", a, r, u, c)
    }
    addResources(a, r, u, c={
        silent: !1
    }) {
        for (const f in u)
            (ae(u[f]) || Array.isArray(u[f])) && this.addResource(a, r, f, u[f], {
                silent: !0
            });
        c.silent || this.emit("added", a, r, u)
    }
    addResourceBundle(a, r, u, c, f, d={
        silent: !1,
        skipCopy: !1
    }) {
        let m = [a, r];
        a.indexOf(".") > -1 && (m = a.split("."),
        c = u,
        u = r,
        r = m[1]),
        this.addNamespaces(r);
        let g = As(this.data, m) || {};
        d.skipCopy || (u = JSON.parse(JSON.stringify(u))),
        c ? Bg(g, u, f) : g = {
            ...g,
            ...u
        },
        Um(this.data, m, g),
        d.silent || this.emit("added", a, r, u)
    }
    removeResourceBundle(a, r) {
        this.hasResourceBundle(a, r) && delete this.data[a][r],
        this.removeNamespaces(r),
        this.emit("removed", a, r)
    }
    hasResourceBundle(a, r) {
        return this.getResource(a, r) !== void 0
    }
    getResourceBundle(a, r) {
        return r || (r = this.options.defaultNS),
        this.getResource(a, r)
    }
    getDataByLanguage(a) {
        return this.data[a]
    }
    hasLanguageSomeTranslations(a) {
        const r = this.getDataByLanguage(a);
        return !!(r && Object.keys(r) || []).find(c => r[c] && Object.keys(r[c]).length > 0)
    }
    toJSON() {
        return this.data
    }
}
var qg = {
    processors: {},
    addPostProcessor(s) {
        this.processors[s.name] = s
    },
    handle(s, a, r, u, c) {
        return s.forEach(f => {
            a = this.processors[f]?.process(a, r, u, c) ?? a
        }
        ),
        a
    }
};
const Gg = Symbol("i18next/PATH_KEY");
function rx() {
    const s = []
      , a = Object.create(null);
    let r;
    return a.get = (u, c) => (r?.revoke?.(),
    c === Gg ? s : (s.push(c),
    r = Proxy.revocable(u, a),
    r.proxy)),
    Proxy.revocable(Object.create(null), a).proxy
}
function Lo(s, a) {
    const {[Gg]: r} = s(rx());
    return r.join(a?.keySeparator ?? ".")
}
const Bm = {}
  , qm = s => !ae(s) && typeof s != "boolean" && typeof s != "number";
class Ms extends Ds {
    constructor(a, r={}) {
        super(),
        Fv(["resourceStore", "languageUtils", "pluralResolver", "interpolator", "backendConnector", "i18nFormat", "utils"], a, this),
        this.options = r,
        this.options.keySeparator === void 0 && (this.options.keySeparator = "."),
        this.logger = Yt.create("translator")
    }
    changeLanguage(a) {
        a && (this.language = a)
    }
    exists(a, r={
        interpolation: {}
    }) {
        const u = {
            ...r
        };
        return a == null ? !1 : this.resolve(a, u)?.res !== void 0
    }
    extractFromKey(a, r) {
        let u = r.nsSeparator !== void 0 ? r.nsSeparator : this.options.nsSeparator;
        u === void 0 && (u = ":");
        const c = r.keySeparator !== void 0 ? r.keySeparator : this.options.keySeparator;
        let f = r.ns || this.options.defaultNS || [];
        const d = u && a.indexOf(u) > -1
          , m = !this.options.userDefinedKeySeparator && !r.keySeparator && !this.options.userDefinedNsSeparator && !r.nsSeparator && !ix(a, u, c);
        if (d && !m) {
            const g = a.match(this.interpolator.nestingRegexp);
            if (g && g.length > 0)
                return {
                    key: a,
                    namespaces: ae(f) ? [f] : f
                };
            const p = a.split(u);
            (u !== c || u === c && this.options.ns.indexOf(p[0]) > -1) && (f = p.shift()),
            a = p.join(c)
        }
        return {
            key: a,
            namespaces: ae(f) ? [f] : f
        }
    }
    translate(a, r, u) {
        let c = typeof r == "object" ? {
            ...r
        } : r;
        if (typeof c != "object" && this.options.overloadTranslationOptionHandler && (c = this.options.overloadTranslationOptionHandler(arguments)),
        typeof options == "object" && (c = {
            ...c
        }),
        c || (c = {}),
        a == null)
            return "";
        typeof a == "function" && (a = Lo(a, c)),
        Array.isArray(a) || (a = [String(a)]);
        const f = c.returnDetails !== void 0 ? c.returnDetails : this.options.returnDetails
          , d = c.keySeparator !== void 0 ? c.keySeparator : this.options.keySeparator
          , {key: m, namespaces: g} = this.extractFromKey(a[a.length - 1], c)
          , p = g[g.length - 1];
        let b = c.nsSeparator !== void 0 ? c.nsSeparator : this.options.nsSeparator;
        b === void 0 && (b = ":");
        const x = c.lng || this.language
          , E = c.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;
        if (x?.toLowerCase() === "cimode")
            return E ? f ? {
                res: `${p}${b}${m}`,
                usedKey: m,
                exactUsedKey: m,
                usedLng: x,
                usedNS: p,
                usedParams: this.getUsedParamsDetails(c)
            } : `${p}${b}${m}` : f ? {
                res: m,
                usedKey: m,
                exactUsedKey: m,
                usedLng: x,
                usedNS: p,
                usedParams: this.getUsedParamsDetails(c)
            } : m;
        const S = this.resolve(a, c);
        let w = S?.res;
        const j = S?.usedKey || m
          , _ = S?.exactUsedKey || m
          , L = ["[object Number]", "[object Function]", "[object RegExp]"]
          , G = c.joinArrays !== void 0 ? c.joinArrays : this.options.joinArrays
          , V = !this.i18nFormat || this.i18nFormat.handleAsObject
          , J = c.count !== void 0 && !ae(c.count)
          , W = Ms.hasDefaultValue(c)
          , ue = J ? this.pluralResolver.getSuffix(x, c.count, c) : ""
          , I = c.ordinal && J ? this.pluralResolver.getSuffix(x, c.count, {
            ordinal: !1
        }) : ""
          , ye = J && !c.ordinal && c.count === 0
          , Ce = ye && c[`defaultValue${this.options.pluralSeparator}zero`] || c[`defaultValue${ue}`] || c[`defaultValue${I}`] || c.defaultValue;
        let k = w;
        V && !w && W && (k = Ce);
        const X = qm(k)
          , Z = Object.prototype.toString.apply(k);
        if (V && k && X && L.indexOf(Z) < 0 && !(ae(G) && Array.isArray(k))) {
            if (!c.returnObjects && !this.options.returnObjects) {
                this.options.returnedObjectHandler || this.logger.warn("accessing an object - but returnObjects options is not enabled!");
                const ne = this.options.returnedObjectHandler ? this.options.returnedObjectHandler(j, k, {
                    ...c,
                    ns: g
                }) : `key '${m} (${this.language})' returned an object instead of string.`;
                return f ? (S.res = ne,
                S.usedParams = this.getUsedParamsDetails(c),
                S) : ne
            }
            if (d) {
                const ne = Array.isArray(k)
                  , oe = ne ? [] : {}
                  , fe = ne ? _ : j;
                for (const D in k)
                    if (Object.prototype.hasOwnProperty.call(k, D)) {
                        const Q = `${fe}${d}${D}`;
                        W && !w ? oe[D] = this.translate(Q, {
                            ...c,
                            defaultValue: qm(Ce) ? Ce[D] : void 0,
                            joinArrays: !1,
                            ns: g
                        }) : oe[D] = this.translate(Q, {
                            ...c,
                            joinArrays: !1,
                            ns: g
                        }),
                        oe[D] === Q && (oe[D] = k[D])
                    }
                w = oe
            }
        } else if (V && ae(G) && Array.isArray(w))
            w = w.join(G),
            w && (w = this.extendTranslation(w, a, c, u));
        else {
            let ne = !1
              , oe = !1;
            !this.isValidLookup(w) && W && (ne = !0,
            w = Ce),
            this.isValidLookup(w) || (oe = !0,
            w = m);
            const D = (c.missingKeyNoValueFallbackToKey || this.options.missingKeyNoValueFallbackToKey) && oe ? void 0 : w
              , Q = W && Ce !== w && this.options.updateMissing;
            if (oe || ne || Q) {
                if (this.logger.log(Q ? "updateKey" : "missingKey", x, p, m, Q ? Ce : w),
                d) {
                    const N = this.resolve(m, {
                        ...c,
                        keySeparator: !1
                    });
                    N && N.res && this.logger.warn("Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.")
                }
                let te = [];
                const xe = this.languageUtils.getFallbackCodes(this.options.fallbackLng, c.lng || this.language);
                if (this.options.saveMissingTo === "fallback" && xe && xe[0])
                    for (let N = 0; N < xe.length; N++)
                        te.push(xe[N]);
                else
                    this.options.saveMissingTo === "all" ? te = this.languageUtils.toResolveHierarchy(c.lng || this.language) : te.push(c.lng || this.language);
                const we = (N, B, K) => {
                    const $ = W && K !== w ? K : D;
                    this.options.missingKeyHandler ? this.options.missingKeyHandler(N, p, B, $, Q, c) : this.backendConnector?.saveMissing && this.backendConnector.saveMissing(N, p, B, $, Q, c),
                    this.emit("missingKey", N, p, B, w)
                }
                ;
                this.options.saveMissing && (this.options.saveMissingPlurals && J ? te.forEach(N => {
                    const B = this.pluralResolver.getSuffixes(N, c);
                    ye && c[`defaultValue${this.options.pluralSeparator}zero`] && B.indexOf(`${this.options.pluralSeparator}zero`) < 0 && B.push(`${this.options.pluralSeparator}zero`),
                    B.forEach(K => {
                        we([N], m + K, c[`defaultValue${K}`] || Ce)
                    }
                    )
                }
                ) : we(te, m, Ce))
            }
            w = this.extendTranslation(w, a, c, S, u),
            oe && w === m && this.options.appendNamespaceToMissingKey && (w = `${p}${b}${m}`),
            (oe || ne) && this.options.parseMissingKeyHandler && (w = this.options.parseMissingKeyHandler(this.options.appendNamespaceToMissingKey ? `${p}${b}${m}` : m, ne ? w : void 0, c))
        }
        return f ? (S.res = w,
        S.usedParams = this.getUsedParamsDetails(c),
        S) : w
    }
    extendTranslation(a, r, u, c, f) {
        if (this.i18nFormat?.parse)
            a = this.i18nFormat.parse(a, {
                ...this.options.interpolation.defaultVariables,
                ...u
            }, u.lng || this.language || c.usedLng, c.usedNS, c.usedKey, {
                resolved: c
            });
        else if (!u.skipInterpolation) {
            u.interpolation && this.interpolator.init({
                ...u,
                interpolation: {
                    ...this.options.interpolation,
                    ...u.interpolation
                }
            });
            const g = ae(a) && (u?.interpolation?.skipOnVariables !== void 0 ? u.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables);
            let p;
            if (g) {
                const x = a.match(this.interpolator.nestingRegexp);
                p = x && x.length
            }
            let b = u.replace && !ae(u.replace) ? u.replace : u;
            if (this.options.interpolation.defaultVariables && (b = {
                ...this.options.interpolation.defaultVariables,
                ...b
            }),
            a = this.interpolator.interpolate(a, b, u.lng || this.language || c.usedLng, u),
            g) {
                const x = a.match(this.interpolator.nestingRegexp)
                  , E = x && x.length;
                p < E && (u.nest = !1)
            }
            !u.lng && c && c.res && (u.lng = this.language || c.usedLng),
            u.nest !== !1 && (a = this.interpolator.nest(a, (...x) => f?.[0] === x[0] && !u.context ? (this.logger.warn(`It seems you are nesting recursively key: ${x[0]} in key: ${r[0]}`),
            null) : this.translate(...x, r), u)),
            u.interpolation && this.interpolator.reset()
        }
        const d = u.postProcess || this.options.postProcess
          , m = ae(d) ? [d] : d;
        return a != null && m?.length && u.applyPostProcessor !== !1 && (a = qg.handle(m, a, r, this.options && this.options.postProcessPassResolved ? {
            i18nResolved: {
                ...c,
                usedParams: this.getUsedParamsDetails(u)
            },
            ...u
        } : u, this)),
        a
    }
    resolve(a, r={}) {
        let u, c, f, d, m;
        return ae(a) && (a = [a]),
        a.forEach(g => {
            if (this.isValidLookup(u))
                return;
            const p = this.extractFromKey(g, r)
              , b = p.key;
            c = b;
            let x = p.namespaces;
            this.options.fallbackNS && (x = x.concat(this.options.fallbackNS));
            const E = r.count !== void 0 && !ae(r.count)
              , S = E && !r.ordinal && r.count === 0
              , w = r.context !== void 0 && (ae(r.context) || typeof r.context == "number") && r.context !== ""
              , j = r.lngs ? r.lngs : this.languageUtils.toResolveHierarchy(r.lng || this.language, r.fallbackLng);
            x.forEach(_ => {
                this.isValidLookup(u) || (m = _,
                !Bm[`${j[0]}-${_}`] && this.utils?.hasLoadedNamespace && !this.utils?.hasLoadedNamespace(m) && (Bm[`${j[0]}-${_}`] = !0,
                this.logger.warn(`key "${c}" for languages "${j.join(", ")}" won't get resolved as namespace "${m}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!")),
                j.forEach(L => {
                    if (this.isValidLookup(u))
                        return;
                    d = L;
                    const G = [b];
                    if (this.i18nFormat?.addLookupKeys)
                        this.i18nFormat.addLookupKeys(G, b, L, _, r);
                    else {
                        let J;
                        E && (J = this.pluralResolver.getSuffix(L, r.count, r));
                        const W = `${this.options.pluralSeparator}zero`
                          , ue = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;
                        if (E && (r.ordinal && J.indexOf(ue) === 0 && G.push(b + J.replace(ue, this.options.pluralSeparator)),
                        G.push(b + J),
                        S && G.push(b + W)),
                        w) {
                            const I = `${b}${this.options.contextSeparator || "_"}${r.context}`;
                            G.push(I),
                            E && (r.ordinal && J.indexOf(ue) === 0 && G.push(I + J.replace(ue, this.options.pluralSeparator)),
                            G.push(I + J),
                            S && G.push(I + W))
                        }
                    }
                    let V;
                    for (; V = G.pop(); )
                        this.isValidLookup(u) || (f = V,
                        u = this.getResource(L, _, V, r))
                }
                ))
            }
            )
        }
        ),
        {
            res: u,
            usedKey: c,
            exactUsedKey: f,
            usedLng: d,
            usedNS: m
        }
    }
    isValidLookup(a) {
        return a !== void 0 && !(!this.options.returnNull && a === null) && !(!this.options.returnEmptyString && a === "")
    }
    getResource(a, r, u, c={}) {
        return this.i18nFormat?.getResource ? this.i18nFormat.getResource(a, r, u, c) : this.resourceStore.getResource(a, r, u, c)
    }
    getUsedParamsDetails(a={}) {
        const r = ["defaultValue", "ordinal", "context", "replace", "lng", "lngs", "fallbackLng", "ns", "keySeparator", "nsSeparator", "returnObjects", "returnDetails", "joinArrays", "postProcess", "interpolation"]
          , u = a.replace && !ae(a.replace);
        let c = u ? a.replace : a;
        if (u && typeof a.count < "u" && (c.count = a.count),
        this.options.interpolation.defaultVariables && (c = {
            ...this.options.interpolation.defaultVariables,
            ...c
        }),
        !u) {
            c = {
                ...c
            };
            for (const f of r)
                delete c[f]
        }
        return c
    }
    static hasDefaultValue(a) {
        const r = "defaultValue";
        for (const u in a)
            if (Object.prototype.hasOwnProperty.call(a, u) && r === u.substring(0, r.length) && a[u] !== void 0)
                return !0;
        return !1
    }
}
class Gm {
    constructor(a) {
        this.options = a,
        this.supportedLngs = this.options.supportedLngs || !1,
        this.logger = Yt.create("languageUtils")
    }
    getScriptPartFromCode(a) {
        if (a = Fa(a),
        !a || a.indexOf("-") < 0)
            return null;
        const r = a.split("-");
        return r.length === 2 || (r.pop(),
        r[r.length - 1].toLowerCase() === "x") ? null : this.formatLanguageCode(r.join("-"))
    }
    getLanguagePartFromCode(a) {
        if (a = Fa(a),
        !a || a.indexOf("-") < 0)
            return a;
        const r = a.split("-");
        return this.formatLanguageCode(r[0])
    }
    formatLanguageCode(a) {
        if (ae(a) && a.indexOf("-") > -1) {
            let r;
            try {
                r = Intl.getCanonicalLocales(a)[0]
            } catch {}
            return r && this.options.lowerCaseLng && (r = r.toLowerCase()),
            r || (this.options.lowerCaseLng ? a.toLowerCase() : a)
        }
        return this.options.cleanCode || this.options.lowerCaseLng ? a.toLowerCase() : a
    }
    isSupportedCode(a) {
        return (this.options.load === "languageOnly" || this.options.nonExplicitSupportedLngs) && (a = this.getLanguagePartFromCode(a)),
        !this.supportedLngs || !this.supportedLngs.length || this.supportedLngs.indexOf(a) > -1
    }
    getBestMatchFromCodes(a) {
        if (!a)
            return null;
        let r;
        return a.forEach(u => {
            if (r)
                return;
            const c = this.formatLanguageCode(u);
            (!this.options.supportedLngs || this.isSupportedCode(c)) && (r = c)
        }
        ),
        !r && this.options.supportedLngs && a.forEach(u => {
            if (r)
                return;
            const c = this.getScriptPartFromCode(u);
            if (this.isSupportedCode(c))
                return r = c;
            const f = this.getLanguagePartFromCode(u);
            if (this.isSupportedCode(f))
                return r = f;
            r = this.options.supportedLngs.find(d => {
                if (d === f)
                    return d;
                if (!(d.indexOf("-") < 0 && f.indexOf("-") < 0) && (d.indexOf("-") > 0 && f.indexOf("-") < 0 && d.substring(0, d.indexOf("-")) === f || d.indexOf(f) === 0 && f.length > 1))
                    return d
            }
            )
        }
        ),
        r || (r = this.getFallbackCodes(this.options.fallbackLng)[0]),
        r
    }
    getFallbackCodes(a, r) {
        if (!a)
            return [];
        if (typeof a == "function" && (a = a(r)),
        ae(a) && (a = [a]),
        Array.isArray(a))
            return a;
        if (!r)
            return a.default || [];
        let u = a[r];
        return u || (u = a[this.getScriptPartFromCode(r)]),
        u || (u = a[this.formatLanguageCode(r)]),
        u || (u = a[this.getLanguagePartFromCode(r)]),
        u || (u = a.default),
        u || []
    }
    toResolveHierarchy(a, r) {
        const u = this.getFallbackCodes((r === !1 ? [] : r) || this.options.fallbackLng || [], a)
          , c = []
          , f = d => {
            d && (this.isSupportedCode(d) ? c.push(d) : this.logger.warn(`rejecting language code not found in supportedLngs: ${d}`))
        }
        ;
        return ae(a) && (a.indexOf("-") > -1 || a.indexOf("_") > -1) ? (this.options.load !== "languageOnly" && f(this.formatLanguageCode(a)),
        this.options.load !== "languageOnly" && this.options.load !== "currentOnly" && f(this.getScriptPartFromCode(a)),
        this.options.load !== "currentOnly" && f(this.getLanguagePartFromCode(a))) : ae(a) && f(this.formatLanguageCode(a)),
        u.forEach(d => {
            c.indexOf(d) < 0 && f(this.formatLanguageCode(d))
        }
        ),
        c
    }
}
const Ym = {
    zero: 0,
    one: 1,
    two: 2,
    few: 3,
    many: 4,
    other: 5
}
  , Vm = {
    select: s => s === 1 ? "one" : "other",
    resolvedOptions: () => ({
        pluralCategories: ["one", "other"]
    })
};
class ux {
    constructor(a, r={}) {
        this.languageUtils = a,
        this.options = r,
        this.logger = Yt.create("pluralResolver"),
        this.pluralRulesCache = {}
    }
    addRule(a, r) {
        this.rules[a] = r
    }
    clearCache() {
        this.pluralRulesCache = {}
    }
    getRule(a, r={}) {
        const u = Fa(a === "dev" ? "en" : a)
          , c = r.ordinal ? "ordinal" : "cardinal"
          , f = JSON.stringify({
            cleanedCode: u,
            type: c
        });
        if (f in this.pluralRulesCache)
            return this.pluralRulesCache[f];
        let d;
        try {
            d = new Intl.PluralRules(u,{
                type: c
            })
        } catch {
            if (!Intl)
                return this.logger.error("No Intl support, please use an Intl polyfill!"),
                Vm;
            if (!a.match(/-|_/))
                return Vm;
            const g = this.languageUtils.getLanguagePartFromCode(a);
            d = this.getRule(g, r)
        }
        return this.pluralRulesCache[f] = d,
        d
    }
    needsPlural(a, r={}) {
        let u = this.getRule(a, r);
        return u || (u = this.getRule("dev", r)),
        u?.resolvedOptions().pluralCategories.length > 1
    }
    getPluralFormsOfKey(a, r, u={}) {
        return this.getSuffixes(a, u).map(c => `${r}${c}`)
    }
    getSuffixes(a, r={}) {
        let u = this.getRule(a, r);
        return u || (u = this.getRule("dev", r)),
        u ? u.resolvedOptions().pluralCategories.sort( (c, f) => Ym[c] - Ym[f]).map(c => `${this.options.prepend}${r.ordinal ? `ordinal${this.options.prepend}` : ""}${c}`) : []
    }
    getSuffix(a, r, u={}) {
        const c = this.getRule(a, u);
        return c ? `${this.options.prepend}${u.ordinal ? `ordinal${this.options.prepend}` : ""}${c.select(r)}` : (this.logger.warn(`no plural rule found for: ${a}`),
        this.getSuffix("dev", r, u))
    }
}
const km = (s, a, r, u=".", c=!0) => {
    let f = Pv(s, a, r);
    return !f && c && ae(r) && (f = Mo(s, r, u),
    f === void 0 && (f = Mo(a, r, u))),
    f
}
  , Eo = s => s.replace(/\$/g, "$$$$");
class ox {
    constructor(a={}) {
        this.logger = Yt.create("interpolator"),
        this.options = a,
        this.format = a?.interpolation?.format || (r => r),
        this.init(a)
    }
    init(a={}) {
        a.interpolation || (a.interpolation = {
            escapeValue: !0
        });
        const {escape: r, escapeValue: u, useRawValueToEscape: c, prefix: f, prefixEscaped: d, suffix: m, suffixEscaped: g, formatSeparator: p, unescapeSuffix: b, unescapePrefix: x, nestingPrefix: E, nestingPrefixEscaped: S, nestingSuffix: w, nestingSuffixEscaped: j, nestingOptionsSeparator: _, maxReplaces: L, alwaysFormat: G} = a.interpolation;
        this.escape = r !== void 0 ? r : tx,
        this.escapeValue = u !== void 0 ? u : !0,
        this.useRawValueToEscape = c !== void 0 ? c : !1,
        this.prefix = f ? Gl(f) : d || "{{",
        this.suffix = m ? Gl(m) : g || "}}",
        this.formatSeparator = p || ",",
        this.unescapePrefix = b ? "" : x || "-",
        this.unescapeSuffix = this.unescapePrefix ? "" : b || "",
        this.nestingPrefix = E ? Gl(E) : S || Gl("$t("),
        this.nestingSuffix = w ? Gl(w) : j || Gl(")"),
        this.nestingOptionsSeparator = _ || ",",
        this.maxReplaces = L || 1e3,
        this.alwaysFormat = G !== void 0 ? G : !1,
        this.resetRegExp()
    }
    reset() {
        this.options && this.init(this.options)
    }
    resetRegExp() {
        const a = (r, u) => r?.source === u ? (r.lastIndex = 0,
        r) : new RegExp(u,"g");
        this.regexp = a(this.regexp, `${this.prefix}(.+?)${this.suffix}`),
        this.regexpUnescape = a(this.regexpUnescape, `${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`),
        this.nestingRegexp = a(this.nestingRegexp, `${this.nestingPrefix}((?:[^()"']+|"[^"]*"|'[^']*'|\\((?:[^()]|"[^"]*"|'[^']*')*\\))*?)${this.nestingSuffix}`)
    }
    interpolate(a, r, u, c) {
        let f, d, m;
        const g = this.options && this.options.interpolation && this.options.interpolation.defaultVariables || {}
          , p = S => {
            if (S.indexOf(this.formatSeparator) < 0) {
                const L = km(r, g, S, this.options.keySeparator, this.options.ignoreJSONStructure);
                return this.alwaysFormat ? this.format(L, void 0, u, {
                    ...c,
                    ...r,
                    interpolationkey: S
                }) : L
            }
            const w = S.split(this.formatSeparator)
              , j = w.shift().trim()
              , _ = w.join(this.formatSeparator).trim();
            return this.format(km(r, g, j, this.options.keySeparator, this.options.ignoreJSONStructure), _, u, {
                ...c,
                ...r,
                interpolationkey: j
            })
        }
        ;
        this.resetRegExp();
        const b = c?.missingInterpolationHandler || this.options.missingInterpolationHandler
          , x = c?.interpolation?.skipOnVariables !== void 0 ? c.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables;
        return [{
            regex: this.regexpUnescape,
            safeValue: S => Eo(S)
        }, {
            regex: this.regexp,
            safeValue: S => this.escapeValue ? Eo(this.escape(S)) : Eo(S)
        }].forEach(S => {
            for (m = 0; f = S.regex.exec(a); ) {
                const w = f[1].trim();
                if (d = p(w),
                d === void 0)
                    if (typeof b == "function") {
                        const _ = b(a, f, c);
                        d = ae(_) ? _ : ""
                    } else if (c && Object.prototype.hasOwnProperty.call(c, w))
                        d = "";
                    else if (x) {
                        d = f[0];
                        continue
                    } else
                        this.logger.warn(`missed to pass in variable ${w} for interpolating ${a}`),
                        d = "";
                else
                    !ae(d) && !this.useRawValueToEscape && (d = Lm(d));
                const j = S.safeValue(d);
                if (a = a.replace(f[0], j),
                x ? (S.regex.lastIndex += d.length,
                S.regex.lastIndex -= f[0].length) : S.regex.lastIndex = 0,
                m++,
                m >= this.maxReplaces)
                    break
            }
        }
        ),
        a
    }
    nest(a, r, u={}) {
        let c, f, d;
        const m = (g, p) => {
            const b = this.nestingOptionsSeparator;
            if (g.indexOf(b) < 0)
                return g;
            const x = g.split(new RegExp(`${b}[ ]*{`));
            let E = `{${x[1]}`;
            g = x[0],
            E = this.interpolate(E, d);
            const S = E.match(/'/g)
              , w = E.match(/"/g);
            ((S?.length ?? 0) % 2 === 0 && !w || w.length % 2 !== 0) && (E = E.replace(/'/g, '"'));
            try {
                d = JSON.parse(E),
                p && (d = {
                    ...p,
                    ...d
                })
            } catch (j) {
                return this.logger.warn(`failed parsing options string in nesting for key ${g}`, j),
                `${g}${b}${E}`
            }
            return d.defaultValue && d.defaultValue.indexOf(this.prefix) > -1 && delete d.defaultValue,
            g
        }
        ;
        for (; c = this.nestingRegexp.exec(a); ) {
            let g = [];
            d = {
                ...u
            },
            d = d.replace && !ae(d.replace) ? d.replace : d,
            d.applyPostProcessor = !1,
            delete d.defaultValue;
            const p = /{.*}/.test(c[1]) ? c[1].lastIndexOf("}") + 1 : c[1].indexOf(this.formatSeparator);
            if (p !== -1 && (g = c[1].slice(p).split(this.formatSeparator).map(b => b.trim()).filter(Boolean),
            c[1] = c[1].slice(0, p)),
            f = r(m.call(this, c[1].trim(), d), d),
            f && c[0] === a && !ae(f))
                return f;
            ae(f) || (f = Lm(f)),
            f || (this.logger.warn(`missed to resolve ${c[1]} for nesting ${a}`),
            f = ""),
            g.length && (f = g.reduce( (b, x) => this.format(b, x, u.lng, {
                ...u,
                interpolationkey: c[1].trim()
            }), f.trim())),
            a = a.replace(c[0], f),
            this.regexp.lastIndex = 0
        }
        return a
    }
}
const cx = s => {
    let a = s.toLowerCase().trim();
    const r = {};
    if (s.indexOf("(") > -1) {
        const u = s.split("(");
        a = u[0].toLowerCase().trim();
        const c = u[1].substring(0, u[1].length - 1);
        a === "currency" && c.indexOf(":") < 0 ? r.currency || (r.currency = c.trim()) : a === "relativetime" && c.indexOf(":") < 0 ? r.range || (r.range = c.trim()) : c.split(";").forEach(d => {
            if (d) {
                const [m,...g] = d.split(":")
                  , p = g.join(":").trim().replace(/^'+|'+$/g, "")
                  , b = m.trim();
                r[b] || (r[b] = p),
                p === "false" && (r[b] = !1),
                p === "true" && (r[b] = !0),
                isNaN(p) || (r[b] = parseInt(p, 10))
            }
        }
        )
    }
    return {
        formatName: a,
        formatOptions: r
    }
}
  , Qm = s => {
    const a = {};
    return (r, u, c) => {
        let f = c;
        c && c.interpolationkey && c.formatParams && c.formatParams[c.interpolationkey] && c[c.interpolationkey] && (f = {
            ...f,
            [c.interpolationkey]: void 0
        });
        const d = u + JSON.stringify(f);
        let m = a[d];
        return m || (m = s(Fa(u), c),
        a[d] = m),
        m(r)
    }
}
  , fx = s => (a, r, u) => s(Fa(r), u)(a);
class dx {
    constructor(a={}) {
        this.logger = Yt.create("formatter"),
        this.options = a,
        this.init(a)
    }
    init(a, r={
        interpolation: {}
    }) {
        this.formatSeparator = r.interpolation.formatSeparator || ",";
        const u = r.cacheInBuiltFormats ? Qm : fx;
        this.formats = {
            number: u( (c, f) => {
                const d = new Intl.NumberFormat(c,{
                    ...f
                });
                return m => d.format(m)
            }
            ),
            currency: u( (c, f) => {
                const d = new Intl.NumberFormat(c,{
                    ...f,
                    style: "currency"
                });
                return m => d.format(m)
            }
            ),
            datetime: u( (c, f) => {
                const d = new Intl.DateTimeFormat(c,{
                    ...f
                });
                return m => d.format(m)
            }
            ),
            relativetime: u( (c, f) => {
                const d = new Intl.RelativeTimeFormat(c,{
                    ...f
                });
                return m => d.format(m, f.range || "day")
            }
            ),
            list: u( (c, f) => {
                const d = new Intl.ListFormat(c,{
                    ...f
                });
                return m => d.format(m)
            }
            )
        }
    }
    add(a, r) {
        this.formats[a.toLowerCase().trim()] = r
    }
    addCached(a, r) {
        this.formats[a.toLowerCase().trim()] = Qm(r)
    }
    format(a, r, u, c={}) {
        const f = r.split(this.formatSeparator);
        if (f.length > 1 && f[0].indexOf("(") > 1 && f[0].indexOf(")") < 0 && f.find(m => m.indexOf(")") > -1)) {
            const m = f.findIndex(g => g.indexOf(")") > -1);
            f[0] = [f[0], ...f.splice(1, m)].join(this.formatSeparator)
        }
        return f.reduce( (m, g) => {
            const {formatName: p, formatOptions: b} = cx(g);
            if (this.formats[p]) {
                let x = m;
                try {
                    const E = c?.formatParams?.[c.interpolationkey] || {}
                      , S = E.locale || E.lng || c.locale || c.lng || u;
                    x = this.formats[p](m, S, {
                        ...b,
                        ...c,
                        ...E
                    })
                } catch (E) {
                    this.logger.warn(E)
                }
                return x
            } else
                this.logger.warn(`there was no format function for ${p}`);
            return m
        }
        , a)
    }
}
const hx = (s, a) => {
    s.pending[a] !== void 0 && (delete s.pending[a],
    s.pendingCount--)
}
;
class mx extends Ds {
    constructor(a, r, u, c={}) {
        super(),
        this.backend = a,
        this.store = r,
        this.services = u,
        this.languageUtils = u.languageUtils,
        this.options = c,
        this.logger = Yt.create("backendConnector"),
        this.waitingReads = [],
        this.maxParallelReads = c.maxParallelReads || 10,
        this.readingCalls = 0,
        this.maxRetries = c.maxRetries >= 0 ? c.maxRetries : 5,
        this.retryTimeout = c.retryTimeout >= 1 ? c.retryTimeout : 350,
        this.state = {},
        this.queue = [],
        this.backend?.init?.(u, c.backend, c)
    }
    queueLoad(a, r, u, c) {
        const f = {}
          , d = {}
          , m = {}
          , g = {};
        return a.forEach(p => {
            let b = !0;
            r.forEach(x => {
                const E = `${p}|${x}`;
                !u.reload && this.store.hasResourceBundle(p, x) ? this.state[E] = 2 : this.state[E] < 0 || (this.state[E] === 1 ? d[E] === void 0 && (d[E] = !0) : (this.state[E] = 1,
                b = !1,
                d[E] === void 0 && (d[E] = !0),
                f[E] === void 0 && (f[E] = !0),
                g[x] === void 0 && (g[x] = !0)))
            }
            ),
            b || (m[p] = !0)
        }
        ),
        (Object.keys(f).length || Object.keys(d).length) && this.queue.push({
            pending: d,
            pendingCount: Object.keys(d).length,
            loaded: {},
            errors: [],
            callback: c
        }),
        {
            toLoad: Object.keys(f),
            pending: Object.keys(d),
            toLoadLanguages: Object.keys(m),
            toLoadNamespaces: Object.keys(g)
        }
    }
    loaded(a, r, u) {
        const c = a.split("|")
          , f = c[0]
          , d = c[1];
        r && this.emit("failedLoading", f, d, r),
        !r && u && this.store.addResourceBundle(f, d, u, void 0, void 0, {
            skipCopy: !0
        }),
        this.state[a] = r ? -1 : 2,
        r && u && (this.state[a] = 0);
        const m = {};
        this.queue.forEach(g => {
            Iv(g.loaded, [f], d),
            hx(g, a),
            r && g.errors.push(r),
            g.pendingCount === 0 && !g.done && (Object.keys(g.loaded).forEach(p => {
                m[p] || (m[p] = {});
                const b = g.loaded[p];
                b.length && b.forEach(x => {
                    m[p][x] === void 0 && (m[p][x] = !0)
                }
                )
            }
            ),
            g.done = !0,
            g.errors.length ? g.callback(g.errors) : g.callback())
        }
        ),
        this.emit("loaded", m),
        this.queue = this.queue.filter(g => !g.done)
    }
    read(a, r, u, c=0, f=this.retryTimeout, d) {
        if (!a.length)
            return d(null, {});
        if (this.readingCalls >= this.maxParallelReads) {
            this.waitingReads.push({
                lng: a,
                ns: r,
                fcName: u,
                tried: c,
                wait: f,
                callback: d
            });
            return
        }
        this.readingCalls++;
        const m = (p, b) => {
            if (this.readingCalls--,
            this.waitingReads.length > 0) {
                const x = this.waitingReads.shift();
                this.read(x.lng, x.ns, x.fcName, x.tried, x.wait, x.callback)
            }
            if (p && b && c < this.maxRetries) {
                setTimeout( () => {
                    this.read.call(this, a, r, u, c + 1, f * 2, d)
                }
                , f);
                return
            }
            d(p, b)
        }
          , g = this.backend[u].bind(this.backend);
        if (g.length === 2) {
            try {
                const p = g(a, r);
                p && typeof p.then == "function" ? p.then(b => m(null, b)).catch(m) : m(null, p)
            } catch (p) {
                m(p)
            }
            return
        }
        return g(a, r, m)
    }
    prepareLoading(a, r, u={}, c) {
        if (!this.backend)
            return this.logger.warn("No backend was added via i18next.use. Will not load resources."),
            c && c();
        ae(a) && (a = this.languageUtils.toResolveHierarchy(a)),
        ae(r) && (r = [r]);
        const f = this.queueLoad(a, r, u, c);
        if (!f.toLoad.length)
            return f.pending.length || c(),
            null;
        f.toLoad.forEach(d => {
            this.loadOne(d)
        }
        )
    }
    load(a, r, u) {
        this.prepareLoading(a, r, {}, u)
    }
    reload(a, r, u) {
        this.prepareLoading(a, r, {
            reload: !0
        }, u)
    }
    loadOne(a, r="") {
        const u = a.split("|")
          , c = u[0]
          , f = u[1];
        this.read(c, f, "read", void 0, void 0, (d, m) => {
            d && this.logger.warn(`${r}loading namespace ${f} for language ${c} failed`, d),
            !d && m && this.logger.log(`${r}loaded namespace ${f} for language ${c}`, m),
            this.loaded(a, d, m)
        }
        )
    }
    saveMissing(a, r, u, c, f, d={}, m= () => {}
    ) {
        if (this.services?.utils?.hasLoadedNamespace && !this.services?.utils?.hasLoadedNamespace(r)) {
            this.logger.warn(`did not save key "${u}" as the namespace "${r}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
            return
        }
        if (!(u == null || u === "")) {
            if (this.backend?.create) {
                const g = {
                    ...d,
                    isUpdate: f
                }
                  , p = this.backend.create.bind(this.backend);
                if (p.length < 6)
                    try {
                        let b;
                        p.length === 5 ? b = p(a, r, u, c, g) : b = p(a, r, u, c),
                        b && typeof b.then == "function" ? b.then(x => m(null, x)).catch(m) : m(null, b)
                    } catch (b) {
                        m(b)
                    }
                else
                    p(a, r, u, c, m, g)
            }
            !a || !a[0] || this.store.addResource(a[0], r, u, c)
        }
    }
}
const Xm = () => ({
    debug: !1,
    initAsync: !0,
    ns: ["translation"],
    defaultNS: ["translation"],
    fallbackLng: ["dev"],
    fallbackNS: !1,
    supportedLngs: !1,
    nonExplicitSupportedLngs: !1,
    load: "all",
    preload: !1,
    simplifyPluralSuffix: !0,
    keySeparator: ".",
    nsSeparator: ":",
    pluralSeparator: "_",
    contextSeparator: "_",
    partialBundledLanguages: !1,
    saveMissing: !1,
    updateMissing: !1,
    saveMissingTo: "fallback",
    saveMissingPlurals: !0,
    missingKeyHandler: !1,
    missingInterpolationHandler: !1,
    postProcess: !1,
    postProcessPassResolved: !1,
    returnNull: !1,
    returnEmptyString: !0,
    returnObjects: !1,
    joinArrays: !1,
    returnedObjectHandler: !1,
    parseMissingKeyHandler: !1,
    appendNamespaceToMissingKey: !1,
    appendNamespaceToCIMode: !1,
    overloadTranslationOptionHandler: s => {
        let a = {};
        if (typeof s[1] == "object" && (a = s[1]),
        ae(s[1]) && (a.defaultValue = s[1]),
        ae(s[2]) && (a.tDescription = s[2]),
        typeof s[2] == "object" || typeof s[3] == "object") {
            const r = s[3] || s[2];
            Object.keys(r).forEach(u => {
                a[u] = r[u]
            }
            )
        }
        return a
    }
    ,
    interpolation: {
        escapeValue: !0,
        format: s => s,
        prefix: "{{",
        suffix: "}}",
        formatSeparator: ",",
        unescapePrefix: "-",
        nestingPrefix: "$t(",
        nestingSuffix: ")",
        nestingOptionsSeparator: ",",
        maxReplaces: 1e3,
        skipOnVariables: !0
    },
    cacheInBuiltFormats: !0
})
  , Km = s => (ae(s.ns) && (s.ns = [s.ns]),
ae(s.fallbackLng) && (s.fallbackLng = [s.fallbackLng]),
ae(s.fallbackNS) && (s.fallbackNS = [s.fallbackNS]),
s.supportedLngs?.indexOf?.("cimode") < 0 && (s.supportedLngs = s.supportedLngs.concat(["cimode"])),
typeof s.initImmediate == "boolean" && (s.initAsync = s.initImmediate),
s)
  , Cs = () => {}
  , gx = s => {
    Object.getOwnPropertyNames(Object.getPrototypeOf(s)).forEach(r => {
        typeof s[r] == "function" && (s[r] = s[r].bind(s))
    }
    )
}
;
class Wa extends Ds {
    constructor(a={}, r) {
        if (super(),
        this.options = Km(a),
        this.services = {},
        this.logger = Yt,
        this.modules = {
            external: []
        },
        gx(this),
        r && !this.isInitialized && !a.isClone) {
            if (!this.options.initAsync)
                return this.init(a, r),
                this;
            setTimeout( () => {
                this.init(a, r)
            }
            , 0)
        }
    }
    init(a={}, r) {
        this.isInitializing = !0,
        typeof a == "function" && (r = a,
        a = {}),
        a.defaultNS == null && a.ns && (ae(a.ns) ? a.defaultNS = a.ns : a.ns.indexOf("translation") < 0 && (a.defaultNS = a.ns[0]));
        const u = Xm();
        this.options = {
            ...u,
            ...this.options,
            ...Km(a)
        },
        this.options.interpolation = {
            ...u.interpolation,
            ...this.options.interpolation
        },
        a.keySeparator !== void 0 && (this.options.userDefinedKeySeparator = a.keySeparator),
        a.nsSeparator !== void 0 && (this.options.userDefinedNsSeparator = a.nsSeparator);
        const c = p => p ? typeof p == "function" ? new p : p : null;
        if (!this.options.isClone) {
            this.modules.logger ? Yt.init(c(this.modules.logger), this.options) : Yt.init(null, this.options);
            let p;
            this.modules.formatter ? p = this.modules.formatter : p = dx;
            const b = new Gm(this.options);
            this.store = new Hm(this.options.resources,this.options);
            const x = this.services;
            x.logger = Yt,
            x.resourceStore = this.store,
            x.languageUtils = b,
            x.pluralResolver = new ux(b,{
                prepend: this.options.pluralSeparator,
                simplifyPluralSuffix: this.options.simplifyPluralSuffix
            }),
            this.options.interpolation.format && this.options.interpolation.format !== u.interpolation.format && this.logger.deprecate("init: you are still using the legacy format function, please use the new approach: https://www.i18next.com/translation-function/formatting"),
            p && (!this.options.interpolation.format || this.options.interpolation.format === u.interpolation.format) && (x.formatter = c(p),
            x.formatter.init && x.formatter.init(x, this.options),
            this.options.interpolation.format = x.formatter.format.bind(x.formatter)),
            x.interpolator = new ox(this.options),
            x.utils = {
                hasLoadedNamespace: this.hasLoadedNamespace.bind(this)
            },
            x.backendConnector = new mx(c(this.modules.backend),x.resourceStore,x,this.options),
            x.backendConnector.on("*", (S, ...w) => {
                this.emit(S, ...w)
            }
            ),
            this.modules.languageDetector && (x.languageDetector = c(this.modules.languageDetector),
            x.languageDetector.init && x.languageDetector.init(x, this.options.detection, this.options)),
            this.modules.i18nFormat && (x.i18nFormat = c(this.modules.i18nFormat),
            x.i18nFormat.init && x.i18nFormat.init(this)),
            this.translator = new Ms(this.services,this.options),
            this.translator.on("*", (S, ...w) => {
                this.emit(S, ...w)
            }
            ),
            this.modules.external.forEach(S => {
                S.init && S.init(this)
            }
            )
        }
        if (this.format = this.options.interpolation.format,
        r || (r = Cs),
        this.options.fallbackLng && !this.services.languageDetector && !this.options.lng) {
            const p = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
            p.length > 0 && p[0] !== "dev" && (this.options.lng = p[0])
        }
        !this.services.languageDetector && !this.options.lng && this.logger.warn("init: no languageDetector is used and no lng is defined"),
        ["getResource", "hasResourceBundle", "getResourceBundle", "getDataByLanguage"].forEach(p => {
            this[p] = (...b) => this.store[p](...b)
        }
        ),
        ["addResource", "addResources", "addResourceBundle", "removeResourceBundle"].forEach(p => {
            this[p] = (...b) => (this.store[p](...b),
            this)
        }
        );
        const m = ka()
          , g = () => {
            const p = (b, x) => {
                this.isInitializing = !1,
                this.isInitialized && !this.initializedStoreOnce && this.logger.warn("init: i18next is already initialized. You should call init just once!"),
                this.isInitialized = !0,
                this.options.isClone || this.logger.log("initialized", this.options),
                this.emit("initialized", this.options),
                m.resolve(x),
                r(b, x)
            }
            ;
            if (this.languages && !this.isInitialized)
                return p(null, this.t.bind(this));
            this.changeLanguage(this.options.lng, p)
        }
        ;
        return this.options.resources || !this.options.initAsync ? g() : setTimeout(g, 0),
        m
    }
    loadResources(a, r=Cs) {
        let u = r;
        const c = ae(a) ? a : this.language;
        if (typeof a == "function" && (u = a),
        !this.options.resources || this.options.partialBundledLanguages) {
            if (c?.toLowerCase() === "cimode" && (!this.options.preload || this.options.preload.length === 0))
                return u();
            const f = []
              , d = m => {
                if (!m || m === "cimode")
                    return;
                this.services.languageUtils.toResolveHierarchy(m).forEach(p => {
                    p !== "cimode" && f.indexOf(p) < 0 && f.push(p)
                }
                )
            }
            ;
            c ? d(c) : this.services.languageUtils.getFallbackCodes(this.options.fallbackLng).forEach(g => d(g)),
            this.options.preload?.forEach?.(m => d(m)),
            this.services.backendConnector.load(f, this.options.ns, m => {
                !m && !this.resolvedLanguage && this.language && this.setResolvedLanguage(this.language),
                u(m)
            }
            )
        } else
            u(null)
    }
    reloadResources(a, r, u) {
        const c = ka();
        return typeof a == "function" && (u = a,
        a = void 0),
        typeof r == "function" && (u = r,
        r = void 0),
        a || (a = this.languages),
        r || (r = this.options.ns),
        u || (u = Cs),
        this.services.backendConnector.reload(a, r, f => {
            c.resolve(),
            u(f)
        }
        ),
        c
    }
    use(a) {
        if (!a)
            throw new Error("You are passing an undefined module! Please check the object you are passing to i18next.use()");
        if (!a.type)
            throw new Error("You are passing a wrong module! Please check the object you are passing to i18next.use()");
        return a.type === "backend" && (this.modules.backend = a),
        (a.type === "logger" || a.log && a.warn && a.error) && (this.modules.logger = a),
        a.type === "languageDetector" && (this.modules.languageDetector = a),
        a.type === "i18nFormat" && (this.modules.i18nFormat = a),
        a.type === "postProcessor" && qg.addPostProcessor(a),
        a.type === "formatter" && (this.modules.formatter = a),
        a.type === "3rdParty" && this.modules.external.push(a),
        this
    }
    setResolvedLanguage(a) {
        if (!(!a || !this.languages) && !(["cimode", "dev"].indexOf(a) > -1)) {
            for (let r = 0; r < this.languages.length; r++) {
                const u = this.languages[r];
                if (!(["cimode", "dev"].indexOf(u) > -1) && this.store.hasLanguageSomeTranslations(u)) {
                    this.resolvedLanguage = u;
                    break
                }
            }
            !this.resolvedLanguage && this.languages.indexOf(a) < 0 && this.store.hasLanguageSomeTranslations(a) && (this.resolvedLanguage = a,
            this.languages.unshift(a))
        }
    }
    changeLanguage(a, r) {
        this.isLanguageChangingTo = a;
        const u = ka();
        this.emit("languageChanging", a);
        const c = m => {
            this.language = m,
            this.languages = this.services.languageUtils.toResolveHierarchy(m),
            this.resolvedLanguage = void 0,
            this.setResolvedLanguage(m)
        }
          , f = (m, g) => {
            g ? this.isLanguageChangingTo === a && (c(g),
            this.translator.changeLanguage(g),
            this.isLanguageChangingTo = void 0,
            this.emit("languageChanged", g),
            this.logger.log("languageChanged", g)) : this.isLanguageChangingTo = void 0,
            u.resolve( (...p) => this.t(...p)),
            r && r(m, (...p) => this.t(...p))
        }
          , d = m => {
            !a && !m && this.services.languageDetector && (m = []);
            const g = ae(m) ? m : m && m[0]
              , p = this.store.hasLanguageSomeTranslations(g) ? g : this.services.languageUtils.getBestMatchFromCodes(ae(m) ? [m] : m);
            p && (this.language || c(p),
            this.translator.language || this.translator.changeLanguage(p),
            this.services.languageDetector?.cacheUserLanguage?.(p)),
            this.loadResources(p, b => {
                f(b, p)
            }
            )
        }
        ;
        return !a && this.services.languageDetector && !this.services.languageDetector.async ? d(this.services.languageDetector.detect()) : !a && this.services.languageDetector && this.services.languageDetector.async ? this.services.languageDetector.detect.length === 0 ? this.services.languageDetector.detect().then(d) : this.services.languageDetector.detect(d) : d(a),
        u
    }
    getFixedT(a, r, u) {
        const c = (f, d, ...m) => {
            let g;
            typeof d != "object" ? g = this.options.overloadTranslationOptionHandler([f, d].concat(m)) : g = {
                ...d
            },
            g.lng = g.lng || c.lng,
            g.lngs = g.lngs || c.lngs,
            g.ns = g.ns || c.ns,
            g.keyPrefix !== "" && (g.keyPrefix = g.keyPrefix || u || c.keyPrefix);
            const p = this.options.keySeparator || ".";
            let b;
            return g.keyPrefix && Array.isArray(f) ? b = f.map(x => (typeof x == "function" && (x = Lo(x, d)),
            `${g.keyPrefix}${p}${x}`)) : (typeof f == "function" && (f = Lo(f, d)),
            b = g.keyPrefix ? `${g.keyPrefix}${p}${f}` : f),
            this.t(b, g)
        }
        ;
        return ae(a) ? c.lng = a : c.lngs = a,
        c.ns = r,
        c.keyPrefix = u,
        c
    }
    t(...a) {
        return this.translator?.translate(...a)
    }
    exists(...a) {
        return this.translator?.exists(...a)
    }
    setDefaultNamespace(a) {
        this.options.defaultNS = a
    }
    hasLoadedNamespace(a, r={}) {
        if (!this.isInitialized)
            return this.logger.warn("hasLoadedNamespace: i18next was not initialized", this.languages),
            !1;
        if (!this.languages || !this.languages.length)
            return this.logger.warn("hasLoadedNamespace: i18n.languages were undefined or empty", this.languages),
            !1;
        const u = r.lng || this.resolvedLanguage || this.languages[0]
          , c = this.options ? this.options.fallbackLng : !1
          , f = this.languages[this.languages.length - 1];
        if (u.toLowerCase() === "cimode")
            return !0;
        const d = (m, g) => {
            const p = this.services.backendConnector.state[`${m}|${g}`];
            return p === -1 || p === 0 || p === 2
        }
        ;
        if (r.precheck) {
            const m = r.precheck(this, d);
            if (m !== void 0)
                return m
        }
        return !!(this.hasResourceBundle(u, a) || !this.services.backendConnector.backend || this.options.resources && !this.options.partialBundledLanguages || d(u, a) && (!c || d(f, a)))
    }
    loadNamespaces(a, r) {
        const u = ka();
        return this.options.ns ? (ae(a) && (a = [a]),
        a.forEach(c => {
            this.options.ns.indexOf(c) < 0 && this.options.ns.push(c)
        }
        ),
        this.loadResources(c => {
            u.resolve(),
            r && r(c)
        }
        ),
        u) : (r && r(),
        Promise.resolve())
    }
    loadLanguages(a, r) {
        const u = ka();
        ae(a) && (a = [a]);
        const c = this.options.preload || []
          , f = a.filter(d => c.indexOf(d) < 0 && this.services.languageUtils.isSupportedCode(d));
        return f.length ? (this.options.preload = c.concat(f),
        this.loadResources(d => {
            u.resolve(),
            r && r(d)
        }
        ),
        u) : (r && r(),
        Promise.resolve())
    }
    dir(a) {
        if (a || (a = this.resolvedLanguage || (this.languages?.length > 0 ? this.languages[0] : this.language)),
        !a)
            return "rtl";
        try {
            const c = new Intl.Locale(a);
            if (c && c.getTextInfo) {
                const f = c.getTextInfo();
                if (f && f.direction)
                    return f.direction
            }
        } catch {}
        const r = ["ar", "shu", "sqr", "ssh", "xaa", "yhd", "yud", "aao", "abh", "abv", "acm", "acq", "acw", "acx", "acy", "adf", "ads", "aeb", "aec", "afb", "ajp", "apc", "apd", "arb", "arq", "ars", "ary", "arz", "auz", "avl", "ayh", "ayl", "ayn", "ayp", "bbz", "pga", "he", "iw", "ps", "pbt", "pbu", "pst", "prp", "prd", "ug", "ur", "ydd", "yds", "yih", "ji", "yi", "hbo", "men", "xmn", "fa", "jpr", "peo", "pes", "prs", "dv", "sam", "ckb"]
          , u = this.services?.languageUtils || new Gm(Xm());
        return a.toLowerCase().indexOf("-latn") > 1 ? "ltr" : r.indexOf(u.getLanguagePartFromCode(a)) > -1 || a.toLowerCase().indexOf("-arab") > 1 ? "rtl" : "ltr"
    }
    static createInstance(a={}, r) {
        return new Wa(a,r)
    }
    cloneInstance(a={}, r=Cs) {
        const u = a.forkResourceStore;
        u && delete a.forkResourceStore;
        const c = {
            ...this.options,
            ...a,
            isClone: !0
        }
          , f = new Wa(c);
        if ((a.debug !== void 0 || a.prefix !== void 0) && (f.logger = f.logger.clone(a)),
        ["store", "services", "language"].forEach(m => {
            f[m] = this[m]
        }
        ),
        f.services = {
            ...this.services
        },
        f.services.utils = {
            hasLoadedNamespace: f.hasLoadedNamespace.bind(f)
        },
        u) {
            const m = Object.keys(this.store.data).reduce( (g, p) => (g[p] = {
                ...this.store.data[p]
            },
            g[p] = Object.keys(g[p]).reduce( (b, x) => (b[x] = {
                ...g[p][x]
            },
            b), g[p]),
            g), {});
            f.store = new Hm(m,c),
            f.services.resourceStore = f.store
        }
        return f.translator = new Ms(f.services,c),
        f.translator.on("*", (m, ...g) => {
            f.emit(m, ...g)
        }
        ),
        f.init(c, r),
        f.translator.options = c,
        f.translator.backendConnector.services.utils = {
            hasLoadedNamespace: f.hasLoadedNamespace.bind(f)
        },
        f
    }
    toJSON() {
        return {
            options: this.options,
            store: this.store,
            language: this.language,
            languages: this.languages,
            resolvedLanguage: this.resolvedLanguage
        }
    }
}
const et = Wa.createInstance();
et.createInstance = Wa.createInstance;
et.createInstance;
et.dir;
et.init;
et.loadResources;
et.reloadResources;
et.use;
et.changeLanguage;
et.getFixedT;
et.t;
et.exists;
et.setDefaultNamespace;
et.hasLoadedNamespace;
et.loadNamespaces;
et.loadLanguages;
const px = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34|nbsp|#160|copy|#169|reg|#174|hellip|#8230|#x2F|#47);/g
  , yx = {
    "&amp;": "&",
    "&#38;": "&",
    "&lt;": "<",
    "&#60;": "<",
    "&gt;": ">",
    "&#62;": ">",
    "&apos;": "'",
    "&#39;": "'",
    "&quot;": '"',
    "&#34;": '"',
    "&nbsp;": " ",
    "&#160;": " ",
    "&copy;": "©",
    "&#169;": "©",
    "&reg;": "®",
    "&#174;": "®",
    "&hellip;": "…",
    "&#8230;": "…",
    "&#x2F;": "/",
    "&#47;": "/"
}
  , vx = s => yx[s]
  , xx = s => s.replace(px, vx);
let Zm = {
    bindI18n: "languageChanged",
    bindI18nStore: "",
    transEmptyNodeValue: "",
    transSupportBasicHtmlNodes: !0,
    transWrapTextNodes: "",
    transKeepBasicHtmlNodesFor: ["br", "strong", "i", "p"],
    useSuspense: !0,
    unescape: xx
};
const bx = (s={}) => {
    Zm = {
        ...Zm,
        ...s
    }
}
  , Sx = {
    type: "3rdParty",
    init(s) {
        bx(s.options.react)
    }
}
  , Ex = H.createContext();
function wx({i18n: s, defaultNS: a, children: r}) {
    const u = H.useMemo( () => ({
        i18n: s,
        defaultNS: a
    }), [s, a]);
    return H.createElement(Ex.Provider, {
        value: u
    }, r)
}
const {slice: _x, forEach: Cx} = [];
function Nx(s) {
    return Cx.call(_x.call(arguments, 1), a => {
        if (a)
            for (const r in a)
                s[r] === void 0 && (s[r] = a[r])
    }
    ),
    s
}
function Tx(s) {
    return typeof s != "string" ? !1 : [/<\s*script.*?>/i, /<\s*\/\s*script\s*>/i, /<\s*img.*?on\w+\s*=/i, /<\s*\w+\s*on\w+\s*=.*?>/i, /javascript\s*:/i, /vbscript\s*:/i, /expression\s*\(/i, /eval\s*\(/i, /alert\s*\(/i, /document\.cookie/i, /document\.write\s*\(/i, /window\.location/i, /innerHTML/i].some(r => r.test(s))
}
const Jm = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/
  , jx = function(s, a) {
    const u = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {
        path: "/"
    }
      , c = encodeURIComponent(a);
    let f = `${s}=${c}`;
    if (u.maxAge > 0) {
        const d = u.maxAge - 0;
        if (Number.isNaN(d))
            throw new Error("maxAge should be a Number");
        f += `; Max-Age=${Math.floor(d)}`
    }
    if (u.domain) {
        if (!Jm.test(u.domain))
            throw new TypeError("option domain is invalid");
        f += `; Domain=${u.domain}`
    }
    if (u.path) {
        if (!Jm.test(u.path))
            throw new TypeError("option path is invalid");
        f += `; Path=${u.path}`
    }
    if (u.expires) {
        if (typeof u.expires.toUTCString != "function")
            throw new TypeError("option expires is invalid");
        f += `; Expires=${u.expires.toUTCString()}`
    }
    if (u.httpOnly && (f += "; HttpOnly"),
    u.secure && (f += "; Secure"),
    u.sameSite)
        switch (typeof u.sameSite == "string" ? u.sameSite.toLowerCase() : u.sameSite) {
        case !0:
            f += "; SameSite=Strict";
            break;
        case "lax":
            f += "; SameSite=Lax";
            break;
        case "strict":
            f += "; SameSite=Strict";
            break;
        case "none":
            f += "; SameSite=None";
            break;
        default:
            throw new TypeError("option sameSite is invalid")
        }
    return u.partitioned && (f += "; Partitioned"),
    f
}
  , $m = {
    create(s, a, r, u) {
        let c = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : {
            path: "/",
            sameSite: "strict"
        };
        r && (c.expires = new Date,
        c.expires.setTime(c.expires.getTime() + r * 60 * 1e3)),
        u && (c.domain = u),
        document.cookie = jx(s, a, c)
    },
    read(s) {
        const a = `${s}=`
          , r = document.cookie.split(";");
        for (let u = 0; u < r.length; u++) {
            let c = r[u];
            for (; c.charAt(0) === " "; )
                c = c.substring(1, c.length);
            if (c.indexOf(a) === 0)
                return c.substring(a.length, c.length)
        }
        return null
    },
    remove(s, a) {
        this.create(s, "", -1, a)
    }
};
var Ox = {
    name: "cookie",
    lookup(s) {
        let {lookupCookie: a} = s;
        if (a && typeof document < "u")
            return $m.read(a) || void 0
    },
    cacheUserLanguage(s, a) {
        let {lookupCookie: r, cookieMinutes: u, cookieDomain: c, cookieOptions: f} = a;
        r && typeof document < "u" && $m.create(r, s, u, c, f)
    }
}
  , Ax = {
    name: "querystring",
    lookup(s) {
        let {lookupQuerystring: a} = s, r;
        if (typeof window < "u") {
            let {search: u} = window.location;
            !window.location.search && window.location.hash?.indexOf("?") > -1 && (u = window.location.hash.substring(window.location.hash.indexOf("?")));
            const f = u.substring(1).split("&");
            for (let d = 0; d < f.length; d++) {
                const m = f[d].indexOf("=");
                m > 0 && f[d].substring(0, m) === a && (r = f[d].substring(m + 1))
            }
        }
        return r
    }
}
  , Rx = {
    name: "hash",
    lookup(s) {
        let {lookupHash: a, lookupFromHashIndex: r} = s, u;
        if (typeof window < "u") {
            const {hash: c} = window.location;
            if (c && c.length > 2) {
                const f = c.substring(1);
                if (a) {
                    const d = f.split("&");
                    for (let m = 0; m < d.length; m++) {
                        const g = d[m].indexOf("=");
                        g > 0 && d[m].substring(0, g) === a && (u = d[m].substring(g + 1))
                    }
                }
                if (u)
                    return u;
                if (!u && r > -1) {
                    const d = c.match(/\/([a-zA-Z-]*)/g);
                    return Array.isArray(d) ? d[typeof r == "number" ? r : 0]?.replace("/", "") : void 0
                }
            }
        }
        return u
    }
};
let Yl = null;
const Fm = () => {
    if (Yl !== null)
        return Yl;
    try {
        if (Yl = typeof window < "u" && window.localStorage !== null,
        !Yl)
            return !1;
        const s = "i18next.translate.boo";
        window.localStorage.setItem(s, "foo"),
        window.localStorage.removeItem(s)
    } catch {
        Yl = !1
    }
    return Yl
}
;
var Mx = {
    name: "localStorage",
    lookup(s) {
        let {lookupLocalStorage: a} = s;
        if (a && Fm())
            return window.localStorage.getItem(a) || void 0
    },
    cacheUserLanguage(s, a) {
        let {lookupLocalStorage: r} = a;
        r && Fm() && window.localStorage.setItem(r, s)
    }
};
let Vl = null;
const Wm = () => {
    if (Vl !== null)
        return Vl;
    try {
        if (Vl = typeof window < "u" && window.sessionStorage !== null,
        !Vl)
            return !1;
        const s = "i18next.translate.boo";
        window.sessionStorage.setItem(s, "foo"),
        window.sessionStorage.removeItem(s)
    } catch {
        Vl = !1
    }
    return Vl
}
;
var Lx = {
    name: "sessionStorage",
    lookup(s) {
        let {lookupSessionStorage: a} = s;
        if (a && Wm())
            return window.sessionStorage.getItem(a) || void 0
    },
    cacheUserLanguage(s, a) {
        let {lookupSessionStorage: r} = a;
        r && Wm() && window.sessionStorage.setItem(r, s)
    }
}
  , zx = {
    name: "navigator",
    lookup(s) {
        const a = [];
        if (typeof navigator < "u") {
            const {languages: r, userLanguage: u, language: c} = navigator;
            if (r)
                for (let f = 0; f < r.length; f++)
                    a.push(r[f]);
            u && a.push(u),
            c && a.push(c)
        }
        return a.length > 0 ? a : void 0
    }
}
  , Dx = {
    name: "htmlTag",
    lookup(s) {
        let {htmlTag: a} = s, r;
        const u = a || (typeof document < "u" ? document.documentElement : null);
        return u && typeof u.getAttribute == "function" && (r = u.getAttribute("lang")),
        r
    }
}
  , Ux = {
    name: "path",
    lookup(s) {
        let {lookupFromPathIndex: a} = s;
        if (typeof window > "u")
            return;
        const r = window.location.pathname.match(/\/([a-zA-Z-]*)/g);
        return Array.isArray(r) ? r[typeof a == "number" ? a : 0]?.replace("/", "") : void 0
    }
}
  , Hx = {
    name: "subdomain",
    lookup(s) {
        let {lookupFromSubdomainIndex: a} = s;
        const r = typeof a == "number" ? a + 1 : 1
          , u = typeof window < "u" && window.location?.hostname?.match(/^(\w{2,5})\.(([a-z0-9-]{1,63}\.[a-z]{2,6})|localhost)/i);
        if (u)
            return u[r]
    }
};
let Yg = !1;
try {
    document.cookie,
    Yg = !0
} catch {}
const Vg = ["querystring", "cookie", "localStorage", "sessionStorage", "navigator", "htmlTag"];
Yg || Vg.splice(1, 1);
const Bx = () => ({
    order: Vg,
    lookupQuerystring: "lng",
    lookupCookie: "i18next",
    lookupLocalStorage: "i18nextLng",
    lookupSessionStorage: "i18nextLng",
    caches: ["localStorage"],
    excludeCacheFor: ["cimode"],
    convertDetectedLanguage: s => s
});
class kg {
    constructor(a) {
        let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        this.type = "languageDetector",
        this.detectors = {},
        this.init(a, r)
    }
    init() {
        let a = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {
            languageUtils: {}
        }
          , r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {}
          , u = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        this.services = a,
        this.options = Nx(r, this.options || {}, Bx()),
        typeof this.options.convertDetectedLanguage == "string" && this.options.convertDetectedLanguage.indexOf("15897") > -1 && (this.options.convertDetectedLanguage = c => c.replace("-", "_")),
        this.options.lookupFromUrlIndex && (this.options.lookupFromPathIndex = this.options.lookupFromUrlIndex),
        this.i18nOptions = u,
        this.addDetector(Ox),
        this.addDetector(Ax),
        this.addDetector(Mx),
        this.addDetector(Lx),
        this.addDetector(zx),
        this.addDetector(Dx),
        this.addDetector(Ux),
        this.addDetector(Hx),
        this.addDetector(Rx)
    }
    addDetector(a) {
        return this.detectors[a.name] = a,
        this
    }
    detect() {
        let a = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : this.options.order
          , r = [];
        return a.forEach(u => {
            if (this.detectors[u]) {
                let c = this.detectors[u].lookup(this.options);
                c && typeof c == "string" && (c = [c]),
                c && (r = r.concat(c))
            }
        }
        ),
        r = r.filter(u => u != null && !Tx(u)).map(u => this.options.convertDetectedLanguage(u)),
        this.services && this.services.languageUtils && this.services.languageUtils.getBestMatchFromCodes ? r : r.length > 0 ? r[0] : null
    }
    cacheUserLanguage(a) {
        let r = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : this.options.caches;
        r && (this.options.excludeCacheFor && this.options.excludeCacheFor.indexOf(a) > -1 || r.forEach(u => {
            this.detectors[u] && this.detectors[u].cacheUserLanguage(a, this.options)
        }
        ))
    }
}
kg.type = "languageDetector";
const Im = Object.assign({})
  , Ja = {};
Object.keys(Im).forEach(s => {
    const a = s.match(/\.\/([^/]+)\/([^/]+)\.ts$/);
    if (a) {
        const [,r] = a
          , u = Im[s];
        Ja[r] || (Ja[r] = {
            translation: {}
        }),
        u.default && (Ja[r].translation = {
            ...Ja[r].translation,
            ...u.default
        })
    }
}
);
et.use(kg).use(Sx).init({
    lng: "en",
    fallbackLng: "en",
    debug: !1,
    resources: Ja,
    interpolation: {
        escapeValue: !1
    }
});
var wo = {
    exports: {}
}
  , Qa = {}
  , _o = {
    exports: {}
}
  , Co = {};
var Pm;
function qx() {
    return Pm || (Pm = 1,
    (function(s) {
        function a(D, Q) {
            var te = D.length;
            D.push(Q);
            e: for (; 0 < te; ) {
                var xe = te - 1 >>> 1
                  , we = D[xe];
                if (0 < c(we, Q))
                    D[xe] = Q,
                    D[te] = we,
                    te = xe;
                else
                    break e
            }
        }
        function r(D) {
            return D.length === 0 ? null : D[0]
        }
        function u(D) {
            if (D.length === 0)
                return null;
            var Q = D[0]
              , te = D.pop();
            if (te !== Q) {
                D[0] = te;
                e: for (var xe = 0, we = D.length, N = we >>> 1; xe < N; ) {
                    var B = 2 * (xe + 1) - 1
                      , K = D[B]
                      , $ = B + 1
                      , se = D[$];
                    if (0 > c(K, te))
                        $ < we && 0 > c(se, K) ? (D[xe] = se,
                        D[$] = te,
                        xe = $) : (D[xe] = K,
                        D[B] = te,
                        xe = B);
                    else if ($ < we && 0 > c(se, te))
                        D[xe] = se,
                        D[$] = te,
                        xe = $;
                    else
                        break e
                }
            }
            return Q
        }
        function c(D, Q) {
            var te = D.sortIndex - Q.sortIndex;
            return te !== 0 ? te : D.id - Q.id
        }
        if (s.unstable_now = void 0,
        typeof performance == "object" && typeof performance.now == "function") {
            var f = performance;
            s.unstable_now = function() {
                return f.now()
            }
        } else {
            var d = Date
              , m = d.now();
            s.unstable_now = function() {
                return d.now() - m
            }
        }
        var g = []
          , p = []
          , b = 1
          , x = null
          , E = 3
          , S = !1
          , w = !1
          , j = !1
          , _ = !1
          , L = typeof setTimeout == "function" ? setTimeout : null
          , G = typeof clearTimeout == "function" ? clearTimeout : null
          , V = typeof setImmediate < "u" ? setImmediate : null;
        function J(D) {
            for (var Q = r(p); Q !== null; ) {
                if (Q.callback === null)
                    u(p);
                else if (Q.startTime <= D)
                    u(p),
                    Q.sortIndex = Q.expirationTime,
                    a(g, Q);
                else
                    break;
                Q = r(p)
            }
        }
        function W(D) {
            if (j = !1,
            J(D),
            !w)
                if (r(g) !== null)
                    w = !0,
                    ue || (ue = !0,
                    Z());
                else {
                    var Q = r(p);
                    Q !== null && fe(W, Q.startTime - D)
                }
        }
        var ue = !1
          , I = -1
          , ye = 5
          , Ce = -1;
        function k() {
            return _ ? !0 : !(s.unstable_now() - Ce < ye)
        }
        function X() {
            if (_ = !1,
            ue) {
                var D = s.unstable_now();
                Ce = D;
                var Q = !0;
                try {
                    e: {
                        w = !1,
                        j && (j = !1,
                        G(I),
                        I = -1),
                        S = !0;
                        var te = E;
                        try {
                            t: {
                                for (J(D),
                                x = r(g); x !== null && !(x.expirationTime > D && k()); ) {
                                    var xe = x.callback;
                                    if (typeof xe == "function") {
                                        x.callback = null,
                                        E = x.priorityLevel;
                                        var we = xe(x.expirationTime <= D);
                                        if (D = s.unstable_now(),
                                        typeof we == "function") {
                                            x.callback = we,
                                            J(D),
                                            Q = !0;
                                            break t
                                        }
                                        x === r(g) && u(g),
                                        J(D)
                                    } else
                                        u(g);
                                    x = r(g)
                                }
                                if (x !== null)
                                    Q = !0;
                                else {
                                    var N = r(p);
                                    N !== null && fe(W, N.startTime - D),
                                    Q = !1
                                }
                            }
                            break e
                        } finally {
                            x = null,
                            E = te,
                            S = !1
                        }
                        Q = void 0
                    }
                } finally {
                    Q ? Z() : ue = !1
                }
            }
        }
        var Z;
        if (typeof V == "function")
            Z = function() {
                V(X)
            }
            ;
        else if (typeof MessageChannel < "u") {
            var ne = new MessageChannel
              , oe = ne.port2;
            ne.port1.onmessage = X,
            Z = function() {
                oe.postMessage(null)
            }
        } else
            Z = function() {
                L(X, 0)
            }
            ;
        function fe(D, Q) {
            I = L(function() {
                D(s.unstable_now())
            }, Q)
        }
        s.unstable_IdlePriority = 5,
        s.unstable_ImmediatePriority = 1,
        s.unstable_LowPriority = 4,
        s.unstable_NormalPriority = 3,
        s.unstable_Profiling = null,
        s.unstable_UserBlockingPriority = 2,
        s.unstable_cancelCallback = function(D) {
            D.callback = null
        }
        ,
        s.unstable_forceFrameRate = function(D) {
            0 > D || 125 < D ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : ye = 0 < D ? Math.floor(1e3 / D) : 5
        }
        ,
        s.unstable_getCurrentPriorityLevel = function() {
            return E
        }
        ,
        s.unstable_next = function(D) {
            switch (E) {
            case 1:
            case 2:
            case 3:
                var Q = 3;
                break;
            default:
                Q = E
            }
            var te = E;
            E = Q;
            try {
                return D()
            } finally {
                E = te
            }
        }
        ,
        s.unstable_requestPaint = function() {
            _ = !0
        }
        ,
        s.unstable_runWithPriority = function(D, Q) {
            switch (D) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
                break;
            default:
                D = 3
            }
            var te = E;
            E = D;
            try {
                return Q()
            } finally {
                E = te
            }
        }
        ,
        s.unstable_scheduleCallback = function(D, Q, te) {
            var xe = s.unstable_now();
            switch (typeof te == "object" && te !== null ? (te = te.delay,
            te = typeof te == "number" && 0 < te ? xe + te : xe) : te = xe,
            D) {
            case 1:
                var we = -1;
                break;
            case 2:
                we = 250;
                break;
            case 5:
                we = 1073741823;
                break;
            case 4:
                we = 1e4;
                break;
            default:
                we = 5e3
            }
            return we = te + we,
            D = {
                id: b++,
                callback: Q,
                priorityLevel: D,
                startTime: te,
                expirationTime: we,
                sortIndex: -1
            },
            te > xe ? (D.sortIndex = te,
            a(p, D),
            r(g) === null && D === r(p) && (j ? (G(I),
            I = -1) : j = !0,
            fe(W, te - xe))) : (D.sortIndex = we,
            a(g, D),
            w || S || (w = !0,
            ue || (ue = !0,
            Z()))),
            D
        }
        ,
        s.unstable_shouldYield = k,
        s.unstable_wrapCallback = function(D) {
            var Q = E;
            return function() {
                var te = E;
                E = Q;
                try {
                    return D.apply(this, arguments)
                } finally {
                    E = te
                }
            }
        }
    }
    )(Co)),
    Co
}
var eg;
function Gx() {
    return eg || (eg = 1,
    _o.exports = qx()),
    _o.exports
}
var No = {
    exports: {}
}
  , tt = {};
var tg;
function Yx() {
    if (tg)
        return tt;
    tg = 1;
    var s = Xo();
    function a(g) {
        var p = "https://react.dev/errors/" + g;
        if (1 < arguments.length) {
            p += "?args[]=" + encodeURIComponent(arguments[1]);
            for (var b = 2; b < arguments.length; b++)
                p += "&args[]=" + encodeURIComponent(arguments[b])
        }
        return "Minified React error #" + g + "; visit " + p + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
    }
    function r() {}
    var u = {
        d: {
            f: r,
            r: function() {
                throw Error(a(522))
            },
            D: r,
            C: r,
            L: r,
            m: r,
            X: r,
            S: r,
            M: r
        },
        p: 0,
        findDOMNode: null
    }
      , c = Symbol.for("react.portal");
    function f(g, p, b) {
        var x = 3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
        return {
            $$typeof: c,
            key: x == null ? null : "" + x,
            children: g,
            containerInfo: p,
            implementation: b
        }
    }
    var d = s.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
    function m(g, p) {
        if (g === "font")
            return "";
        if (typeof p == "string")
            return p === "use-credentials" ? p : ""
    }
    return tt.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = u,
    tt.createPortal = function(g, p) {
        var b = 2 < arguments.length && arguments[2] !== void 0 ? arguments[2] : null;
        if (!p || p.nodeType !== 1 && p.nodeType !== 9 && p.nodeType !== 11)
            throw Error(a(299));
        return f(g, p, null, b)
    }
    ,
    tt.flushSync = function(g) {
        var p = d.T
          , b = u.p;
        try {
            if (d.T = null,
            u.p = 2,
            g)
                return g()
        } finally {
            d.T = p,
            u.p = b,
            u.d.f()
        }
    }
    ,
    tt.preconnect = function(g, p) {
        typeof g == "string" && (p ? (p = p.crossOrigin,
        p = typeof p == "string" ? p === "use-credentials" ? p : "" : void 0) : p = null,
        u.d.C(g, p))
    }
    ,
    tt.prefetchDNS = function(g) {
        typeof g == "string" && u.d.D(g)
    }
    ,
    tt.preinit = function(g, p) {
        if (typeof g == "string" && p && typeof p.as == "string") {
            var b = p.as
              , x = m(b, p.crossOrigin)
              , E = typeof p.integrity == "string" ? p.integrity : void 0
              , S = typeof p.fetchPriority == "string" ? p.fetchPriority : void 0;
            b === "style" ? u.d.S(g, typeof p.precedence == "string" ? p.precedence : void 0, {
                crossOrigin: x,
                integrity: E,
                fetchPriority: S
            }) : b === "script" && u.d.X(g, {
                crossOrigin: x,
                integrity: E,
                fetchPriority: S,
                nonce: typeof p.nonce == "string" ? p.nonce : void 0
            })
        }
    }
    ,
    tt.preinitModule = function(g, p) {
        if (typeof g == "string")
            if (typeof p == "object" && p !== null) {
                if (p.as == null || p.as === "script") {
                    var b = m(p.as, p.crossOrigin);
                    u.d.M(g, {
                        crossOrigin: b,
                        integrity: typeof p.integrity == "string" ? p.integrity : void 0,
                        nonce: typeof p.nonce == "string" ? p.nonce : void 0
                    })
                }
            } else
                p == null && u.d.M(g)
    }
    ,
    tt.preload = function(g, p) {
        if (typeof g == "string" && typeof p == "object" && p !== null && typeof p.as == "string") {
            var b = p.as
              , x = m(b, p.crossOrigin);
            u.d.L(g, b, {
                crossOrigin: x,
                integrity: typeof p.integrity == "string" ? p.integrity : void 0,
                nonce: typeof p.nonce == "string" ? p.nonce : void 0,
                type: typeof p.type == "string" ? p.type : void 0,
                fetchPriority: typeof p.fetchPriority == "string" ? p.fetchPriority : void 0,
                referrerPolicy: typeof p.referrerPolicy == "string" ? p.referrerPolicy : void 0,
                imageSrcSet: typeof p.imageSrcSet == "string" ? p.imageSrcSet : void 0,
                imageSizes: typeof p.imageSizes == "string" ? p.imageSizes : void 0,
                media: typeof p.media == "string" ? p.media : void 0
            })
        }
    }
    ,
    tt.preloadModule = function(g, p) {
        if (typeof g == "string")
            if (p) {
                var b = m(p.as, p.crossOrigin);
                u.d.m(g, {
                    as: typeof p.as == "string" && p.as !== "script" ? p.as : void 0,
                    crossOrigin: b,
                    integrity: typeof p.integrity == "string" ? p.integrity : void 0
                })
            } else
                u.d.m(g)
    }
    ,
    tt.requestFormReset = function(g) {
        u.d.r(g)
    }
    ,
    tt.unstable_batchedUpdates = function(g, p) {
        return g(p)
    }
    ,
    tt.useFormState = function(g, p, b) {
        return d.H.useFormState(g, p, b)
    }
    ,
    tt.useFormStatus = function() {
        return d.H.useHostTransitionStatus()
    }
    ,
    tt.version = "19.2.4",
    tt
}
var ng;
function Vx() {
    if (ng)
        return No.exports;
    ng = 1;
    function s() {
        if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
            try {
                __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(s)
            } catch (a) {
                console.error(a)
            }
    }
    return s(),
    No.exports = Yx(),
    No.exports
}
var lg;
function kx() {
    if (lg)
        return Qa;
    lg = 1;
    var s = Gx()
      , a = Xo()
      , r = Vx();
    function u(e) {
        var t = "https://react.dev/errors/" + e;
        if (1 < arguments.length) {
            t += "?args[]=" + encodeURIComponent(arguments[1]);
            for (var n = 2; n < arguments.length; n++)
                t += "&args[]=" + encodeURIComponent(arguments[n])
        }
        return "Minified React error #" + e + "; visit " + t + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings."
    }
    function c(e) {
        return !(!e || e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11)
    }
    function f(e) {
        var t = e
          , n = e;
        if (e.alternate)
            for (; t.return; )
                t = t.return;
        else {
            e = t;
            do
                t = e,
                (t.flags & 4098) !== 0 && (n = t.return),
                e = t.return;
            while (e)
        }
        return t.tag === 3 ? n : null
    }
    function d(e) {
        if (e.tag === 13) {
            var t = e.memoizedState;
            if (t === null && (e = e.alternate,
            e !== null && (t = e.memoizedState)),
            t !== null)
                return t.dehydrated
        }
        return null
    }
    function m(e) {
        if (e.tag === 31) {
            var t = e.memoizedState;
            if (t === null && (e = e.alternate,
            e !== null && (t = e.memoizedState)),
            t !== null)
                return t.dehydrated
        }
        return null
    }
    function g(e) {
        if (f(e) !== e)
            throw Error(u(188))
    }
    function p(e) {
        var t = e.alternate;
        if (!t) {
            if (t = f(e),
            t === null)
                throw Error(u(188));
            return t !== e ? null : e
        }
        for (var n = e, l = t; ; ) {
            var i = n.return;
            if (i === null)
                break;
            var o = i.alternate;
            if (o === null) {
                if (l = i.return,
                l !== null) {
                    n = l;
                    continue
                }
                break
            }
            if (i.child === o.child) {
                for (o = i.child; o; ) {
                    if (o === n)
                        return g(i),
                        e;
                    if (o === l)
                        return g(i),
                        t;
                    o = o.sibling
                }
                throw Error(u(188))
            }
            if (n.return !== l.return)
                n = i,
                l = o;
            else {
                for (var h = !1, v = i.child; v; ) {
                    if (v === n) {
                        h = !0,
                        n = i,
                        l = o;
                        break
                    }
                    if (v === l) {
                        h = !0,
                        l = i,
                        n = o;
                        break
                    }
                    v = v.sibling
                }
                if (!h) {
                    for (v = o.child; v; ) {
                        if (v === n) {
                            h = !0,
                            n = o,
                            l = i;
                            break
                        }
                        if (v === l) {
                            h = !0,
                            l = o,
                            n = i;
                            break
                        }
                        v = v.sibling
                    }
                    if (!h)
                        throw Error(u(189))
                }
            }
            if (n.alternate !== l)
                throw Error(u(190))
        }
        if (n.tag !== 3)
            throw Error(u(188));
        return n.stateNode.current === n ? e : t
    }
    function b(e) {
        var t = e.tag;
        if (t === 5 || t === 26 || t === 27 || t === 6)
            return e;
        for (e = e.child; e !== null; ) {
            if (t = b(e),
            t !== null)
                return t;
            e = e.sibling
        }
        return null
    }
    var x = Object.assign
      , E = Symbol.for("react.element")
      , S = Symbol.for("react.transitional.element")
      , w = Symbol.for("react.portal")
      , j = Symbol.for("react.fragment")
      , _ = Symbol.for("react.strict_mode")
      , L = Symbol.for("react.profiler")
      , G = Symbol.for("react.consumer")
      , V = Symbol.for("react.context")
      , J = Symbol.for("react.forward_ref")
      , W = Symbol.for("react.suspense")
      , ue = Symbol.for("react.suspense_list")
      , I = Symbol.for("react.memo")
      , ye = Symbol.for("react.lazy")
      , Ce = Symbol.for("react.activity")
      , k = Symbol.for("react.memo_cache_sentinel")
      , X = Symbol.iterator;
    function Z(e) {
        return e === null || typeof e != "object" ? null : (e = X && e[X] || e["@@iterator"],
        typeof e == "function" ? e : null)
    }
    var ne = Symbol.for("react.client.reference");
    function oe(e) {
        if (e == null)
            return null;
        if (typeof e == "function")
            return e.$$typeof === ne ? null : e.displayName || e.name || null;
        if (typeof e == "string")
            return e;
        switch (e) {
        case j:
            return "Fragment";
        case L:
            return "Profiler";
        case _:
            return "StrictMode";
        case W:
            return "Suspense";
        case ue:
            return "SuspenseList";
        case Ce:
            return "Activity"
        }
        if (typeof e == "object")
            switch (e.$$typeof) {
            case w:
                return "Portal";
            case V:
                return e.displayName || "Context";
            case G:
                return (e._context.displayName || "Context") + ".Consumer";
            case J:
                var t = e.render;
                return e = e.displayName,
                e || (e = t.displayName || t.name || "",
                e = e !== "" ? "ForwardRef(" + e + ")" : "ForwardRef"),
                e;
            case I:
                return t = e.displayName || null,
                t !== null ? t : oe(e.type) || "Memo";
            case ye:
                t = e._payload,
                e = e._init;
                try {
                    return oe(e(t))
                } catch {}
            }
        return null
    }
    var fe = Array.isArray
      , D = a.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
      , Q = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
      , te = {
        pending: !1,
        data: null,
        method: null,
        action: null
    }
      , xe = []
      , we = -1;
    function N(e) {
        return {
            current: e
        }
    }
    function B(e) {
        0 > we || (e.current = xe[we],
        xe[we] = null,
        we--)
    }
    function K(e, t) {
        we++,
        xe[we] = e.current,
        e.current = t
    }
    var $ = N(null)
      , se = N(null)
      , de = N(null)
      , _e = N(null);
    function nt(e, t) {
        switch (K(de, t),
        K(se, e),
        K($, null),
        t.nodeType) {
        case 9:
        case 11:
            e = (e = t.documentElement) && (e = e.namespaceURI) ? wh(e) : 0;
            break;
        default:
            if (e = t.tagName,
            t = t.namespaceURI)
                t = wh(t),
                e = _h(t, e);
            else
                switch (e) {
                case "svg":
                    e = 1;
                    break;
                case "math":
                    e = 2;
                    break;
                default:
                    e = 0
                }
        }
        B($),
        K($, e)
    }
    function He() {
        B($),
        B(se),
        B(de)
    }
    function Zl(e) {
        e.memoizedState !== null && K(_e, e);
        var t = $.current
          , n = _h(t, e.type);
        t !== n && (K(se, e),
        K($, n))
    }
    function ni(e) {
        se.current === e && (B($),
        B(se)),
        _e.current === e && (B(_e),
        Ua._currentValue = te)
    }
    var qs, Io;
    function Hn(e) {
        if (qs === void 0)
            try {
                throw Error()
            } catch (n) {
                var t = n.stack.trim().match(/\n( *(at )?)/);
                qs = t && t[1] || "",
                Io = -1 < n.stack.indexOf(`
    at`) ? " (<anonymous>)" : -1 < n.stack.indexOf("@") ? "@unknown:0:0" : ""
            }
        return `
` + qs + e + Io
    }
    var Gs = !1;
    function Ys(e, t) {
        if (!e || Gs)
            return "";
        Gs = !0;
        var n = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        try {
            var l = {
                DetermineComponentFrameRoot: function() {
                    try {
                        if (t) {
                            var Y = function() {
                                throw Error()
                            };
                            if (Object.defineProperty(Y.prototype, "props", {
                                set: function() {
                                    throw Error()
                                }
                            }),
                            typeof Reflect == "object" && Reflect.construct) {
                                try {
                                    Reflect.construct(Y, [])
                                } catch (z) {
                                    var M = z
                                }
                                Reflect.construct(e, [], Y)
                            } else {
                                try {
                                    Y.call()
                                } catch (z) {
                                    M = z
                                }
                                e.call(Y.prototype)
                            }
                        } else {
                            try {
                                throw Error()
                            } catch (z) {
                                M = z
                            }
                            (Y = e()) && typeof Y.catch == "function" && Y.catch(function() {})
                        }
                    } catch (z) {
                        if (z && M && typeof z.stack == "string")
                            return [z.stack, M.stack]
                    }
                    return [null, null]
                }
            };
            l.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
            var i = Object.getOwnPropertyDescriptor(l.DetermineComponentFrameRoot, "name");
            i && i.configurable && Object.defineProperty(l.DetermineComponentFrameRoot, "name", {
                value: "DetermineComponentFrameRoot"
            });
            var o = l.DetermineComponentFrameRoot()
              , h = o[0]
              , v = o[1];
            if (h && v) {
                var C = h.split(`
`)
                  , R = v.split(`
`);
                for (i = l = 0; l < C.length && !C[l].includes("DetermineComponentFrameRoot"); )
                    l++;
                for (; i < R.length && !R[i].includes("DetermineComponentFrameRoot"); )
                    i++;
                if (l === C.length || i === R.length)
                    for (l = C.length - 1,
                    i = R.length - 1; 1 <= l && 0 <= i && C[l] !== R[i]; )
                        i--;
                for (; 1 <= l && 0 <= i; l--,
                i--)
                    if (C[l] !== R[i]) {
                        if (l !== 1 || i !== 1)
                            do
                                if (l--,
                                i--,
                                0 > i || C[l] !== R[i]) {
                                    var U = `
` + C[l].replace(" at new ", " at ");
                                    return e.displayName && U.includes("<anonymous>") && (U = U.replace("<anonymous>", e.displayName)),
                                    U
                                }
                            while (1 <= l && 0 <= i);
                        break
                    }
            }
        } finally {
            Gs = !1,
            Error.prepareStackTrace = n
        }
        return (n = e ? e.displayName || e.name : "") ? Hn(n) : ""
    }
    function hp(e, t) {
        switch (e.tag) {
        case 26:
        case 27:
        case 5:
            return Hn(e.type);
        case 16:
            return Hn("Lazy");
        case 13:
            return e.child !== t && t !== null ? Hn("Suspense Fallback") : Hn("Suspense");
        case 19:
            return Hn("SuspenseList");
        case 0:
        case 15:
            return Ys(e.type, !1);
        case 11:
            return Ys(e.type.render, !1);
        case 1:
            return Ys(e.type, !0);
        case 31:
            return Hn("Activity");
        default:
            return ""
        }
    }
    function Po(e) {
        try {
            var t = ""
              , n = null;
            do
                t += hp(e, n),
                n = e,
                e = e.return;
            while (e);
            return t
        } catch (l) {
            return `
Error generating stack: ` + l.message + `
` + l.stack
        }
    }
    var Vs = Object.prototype.hasOwnProperty
      , ks = s.unstable_scheduleCallback
      , Qs = s.unstable_cancelCallback
      , mp = s.unstable_shouldYield
      , gp = s.unstable_requestPaint
      , ft = s.unstable_now
      , pp = s.unstable_getCurrentPriorityLevel
      , ec = s.unstable_ImmediatePriority
      , tc = s.unstable_UserBlockingPriority
      , li = s.unstable_NormalPriority
      , yp = s.unstable_LowPriority
      , nc = s.unstable_IdlePriority
      , vp = s.log
      , xp = s.unstable_setDisableYieldValue
      , Jl = null
      , dt = null;
    function dn(e) {
        if (typeof vp == "function" && xp(e),
        dt && typeof dt.setStrictMode == "function")
            try {
                dt.setStrictMode(Jl, e)
            } catch {}
    }
    var ht = Math.clz32 ? Math.clz32 : Ep
      , bp = Math.log
      , Sp = Math.LN2;
    function Ep(e) {
        return e >>>= 0,
        e === 0 ? 32 : 31 - (bp(e) / Sp | 0) | 0
    }
    var ai = 256
      , ii = 262144
      , si = 4194304;
    function Bn(e) {
        var t = e & 42;
        if (t !== 0)
            return t;
        switch (e & -e) {
        case 1:
            return 1;
        case 2:
            return 2;
        case 4:
            return 4;
        case 8:
            return 8;
        case 16:
            return 16;
        case 32:
            return 32;
        case 64:
            return 64;
        case 128:
            return 128;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
            return e & 261888;
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
            return e & 3932160;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
            return e & 62914560;
        case 67108864:
            return 67108864;
        case 134217728:
            return 134217728;
        case 268435456:
            return 268435456;
        case 536870912:
            return 536870912;
        case 1073741824:
            return 0;
        default:
            return e
        }
    }
    function ri(e, t, n) {
        var l = e.pendingLanes;
        if (l === 0)
            return 0;
        var i = 0
          , o = e.suspendedLanes
          , h = e.pingedLanes;
        e = e.warmLanes;
        var v = l & 134217727;
        return v !== 0 ? (l = v & ~o,
        l !== 0 ? i = Bn(l) : (h &= v,
        h !== 0 ? i = Bn(h) : n || (n = v & ~e,
        n !== 0 && (i = Bn(n))))) : (v = l & ~o,
        v !== 0 ? i = Bn(v) : h !== 0 ? i = Bn(h) : n || (n = l & ~e,
        n !== 0 && (i = Bn(n)))),
        i === 0 ? 0 : t !== 0 && t !== i && (t & o) === 0 && (o = i & -i,
        n = t & -t,
        o >= n || o === 32 && (n & 4194048) !== 0) ? t : i
    }
    function $l(e, t) {
        return (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0
    }
    function wp(e, t) {
        switch (e) {
        case 1:
        case 2:
        case 4:
        case 8:
        case 64:
            return t + 250;
        case 16:
        case 32:
        case 128:
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
            return t + 5e3;
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
            return -1;
        case 67108864:
        case 134217728:
        case 268435456:
        case 536870912:
        case 1073741824:
            return -1;
        default:
            return -1
        }
    }
    function lc() {
        var e = si;
        return si <<= 1,
        (si & 62914560) === 0 && (si = 4194304),
        e
    }
    function Xs(e) {
        for (var t = [], n = 0; 31 > n; n++)
            t.push(e);
        return t
    }
    function Fl(e, t) {
        e.pendingLanes |= t,
        t !== 268435456 && (e.suspendedLanes = 0,
        e.pingedLanes = 0,
        e.warmLanes = 0)
    }
    function _p(e, t, n, l, i, o) {
        var h = e.pendingLanes;
        e.pendingLanes = n,
        e.suspendedLanes = 0,
        e.pingedLanes = 0,
        e.warmLanes = 0,
        e.expiredLanes &= n,
        e.entangledLanes &= n,
        e.errorRecoveryDisabledLanes &= n,
        e.shellSuspendCounter = 0;
        var v = e.entanglements
          , C = e.expirationTimes
          , R = e.hiddenUpdates;
        for (n = h & ~n; 0 < n; ) {
            var U = 31 - ht(n)
              , Y = 1 << U;
            v[U] = 0,
            C[U] = -1;
            var M = R[U];
            if (M !== null)
                for (R[U] = null,
                U = 0; U < M.length; U++) {
                    var z = M[U];
                    z !== null && (z.lane &= -536870913)
                }
            n &= ~Y
        }
        l !== 0 && ac(e, l, 0),
        o !== 0 && i === 0 && e.tag !== 0 && (e.suspendedLanes |= o & ~(h & ~t))
    }
    function ac(e, t, n) {
        e.pendingLanes |= t,
        e.suspendedLanes &= ~t;
        var l = 31 - ht(t);
        e.entangledLanes |= t,
        e.entanglements[l] = e.entanglements[l] | 1073741824 | n & 261930
    }
    function ic(e, t) {
        var n = e.entangledLanes |= t;
        for (e = e.entanglements; n; ) {
            var l = 31 - ht(n)
              , i = 1 << l;
            i & t | e[l] & t && (e[l] |= t),
            n &= ~i
        }
    }
    function sc(e, t) {
        var n = t & -t;
        return n = (n & 42) !== 0 ? 1 : Ks(n),
        (n & (e.suspendedLanes | t)) !== 0 ? 0 : n
    }
    function Ks(e) {
        switch (e) {
        case 2:
            e = 1;
            break;
        case 8:
            e = 4;
            break;
        case 32:
            e = 16;
            break;
        case 256:
        case 512:
        case 1024:
        case 2048:
        case 4096:
        case 8192:
        case 16384:
        case 32768:
        case 65536:
        case 131072:
        case 262144:
        case 524288:
        case 1048576:
        case 2097152:
        case 4194304:
        case 8388608:
        case 16777216:
        case 33554432:
            e = 128;
            break;
        case 268435456:
            e = 134217728;
            break;
        default:
            e = 0
        }
        return e
    }
    function Zs(e) {
        return e &= -e,
        2 < e ? 8 < e ? (e & 134217727) !== 0 ? 32 : 268435456 : 8 : 2
    }
    function rc() {
        var e = Q.p;
        return e !== 0 ? e : (e = window.event,
        e === void 0 ? 32 : Zh(e.type))
    }
    function uc(e, t) {
        var n = Q.p;
        try {
            return Q.p = e,
            t()
        } finally {
            Q.p = n
        }
    }
    var hn = Math.random().toString(36).slice(2)
      , $e = "__reactFiber$" + hn
      , at = "__reactProps$" + hn
      , nl = "__reactContainer$" + hn
      , Js = "__reactEvents$" + hn
      , Cp = "__reactListeners$" + hn
      , Np = "__reactHandles$" + hn
      , oc = "__reactResources$" + hn
      , Wl = "__reactMarker$" + hn;
    function $s(e) {
        delete e[$e],
        delete e[at],
        delete e[Js],
        delete e[Cp],
        delete e[Np]
    }
    function ll(e) {
        var t = e[$e];
        if (t)
            return t;
        for (var n = e.parentNode; n; ) {
            if (t = n[nl] || n[$e]) {
                if (n = t.alternate,
                t.child !== null || n !== null && n.child !== null)
                    for (e = Rh(e); e !== null; ) {
                        if (n = e[$e])
                            return n;
                        e = Rh(e)
                    }
                return t
            }
            e = n,
            n = e.parentNode
        }
        return null
    }
    function al(e) {
        if (e = e[$e] || e[nl]) {
            var t = e.tag;
            if (t === 5 || t === 6 || t === 13 || t === 31 || t === 26 || t === 27 || t === 3)
                return e
        }
        return null
    }
    function Il(e) {
        var t = e.tag;
        if (t === 5 || t === 26 || t === 27 || t === 6)
            return e.stateNode;
        throw Error(u(33))
    }
    function il(e) {
        var t = e[oc];
        return t || (t = e[oc] = {
            hoistableStyles: new Map,
            hoistableScripts: new Map
        }),
        t
    }
    function Ke(e) {
        e[Wl] = !0
    }
    var cc = new Set
      , fc = {};
    function qn(e, t) {
        sl(e, t),
        sl(e + "Capture", t)
    }
    function sl(e, t) {
        for (fc[e] = t,
        e = 0; e < t.length; e++)
            cc.add(t[e])
    }
    var Tp = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$")
      , dc = {}
      , hc = {};
    function jp(e) {
        return Vs.call(hc, e) ? !0 : Vs.call(dc, e) ? !1 : Tp.test(e) ? hc[e] = !0 : (dc[e] = !0,
        !1)
    }
    function ui(e, t, n) {
        if (jp(t))
            if (n === null)
                e.removeAttribute(t);
            else {
                switch (typeof n) {
                case "undefined":
                case "function":
                case "symbol":
                    e.removeAttribute(t);
                    return;
                case "boolean":
                    var l = t.toLowerCase().slice(0, 5);
                    if (l !== "data-" && l !== "aria-") {
                        e.removeAttribute(t);
                        return
                    }
                }
                e.setAttribute(t, "" + n)
            }
    }
    function oi(e, t, n) {
        if (n === null)
            e.removeAttribute(t);
        else {
            switch (typeof n) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
                e.removeAttribute(t);
                return
            }
            e.setAttribute(t, "" + n)
        }
    }
    function Qt(e, t, n, l) {
        if (l === null)
            e.removeAttribute(n);
        else {
            switch (typeof l) {
            case "undefined":
            case "function":
            case "symbol":
            case "boolean":
                e.removeAttribute(n);
                return
            }
            e.setAttributeNS(t, n, "" + l)
        }
    }
    function St(e) {
        switch (typeof e) {
        case "bigint":
        case "boolean":
        case "number":
        case "string":
        case "undefined":
            return e;
        case "object":
            return e;
        default:
            return ""
        }
    }
    function mc(e) {
        var t = e.type;
        return (e = e.nodeName) && e.toLowerCase() === "input" && (t === "checkbox" || t === "radio")
    }
    function Op(e, t, n) {
        var l = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
        if (!e.hasOwnProperty(t) && typeof l < "u" && typeof l.get == "function" && typeof l.set == "function") {
            var i = l.get
              , o = l.set;
            return Object.defineProperty(e, t, {
                configurable: !0,
                get: function() {
                    return i.call(this)
                },
                set: function(h) {
                    n = "" + h,
                    o.call(this, h)
                }
            }),
            Object.defineProperty(e, t, {
                enumerable: l.enumerable
            }),
            {
                getValue: function() {
                    return n
                },
                setValue: function(h) {
                    n = "" + h
                },
                stopTracking: function() {
                    e._valueTracker = null,
                    delete e[t]
                }
            }
        }
    }
    function Fs(e) {
        if (!e._valueTracker) {
            var t = mc(e) ? "checked" : "value";
            e._valueTracker = Op(e, t, "" + e[t])
        }
    }
    function gc(e) {
        if (!e)
            return !1;
        var t = e._valueTracker;
        if (!t)
            return !0;
        var n = t.getValue()
          , l = "";
        return e && (l = mc(e) ? e.checked ? "true" : "false" : e.value),
        e = l,
        e !== n ? (t.setValue(e),
        !0) : !1
    }
    function ci(e) {
        if (e = e || (typeof document < "u" ? document : void 0),
        typeof e > "u")
            return null;
        try {
            return e.activeElement || e.body
        } catch {
            return e.body
        }
    }
    var Ap = /[\n"\\]/g;
    function Et(e) {
        return e.replace(Ap, function(t) {
            return "\\" + t.charCodeAt(0).toString(16) + " "
        })
    }
    function Ws(e, t, n, l, i, o, h, v) {
        e.name = "",
        h != null && typeof h != "function" && typeof h != "symbol" && typeof h != "boolean" ? e.type = h : e.removeAttribute("type"),
        t != null ? h === "number" ? (t === 0 && e.value === "" || e.value != t) && (e.value = "" + St(t)) : e.value !== "" + St(t) && (e.value = "" + St(t)) : h !== "submit" && h !== "reset" || e.removeAttribute("value"),
        t != null ? Is(e, h, St(t)) : n != null ? Is(e, h, St(n)) : l != null && e.removeAttribute("value"),
        i == null && o != null && (e.defaultChecked = !!o),
        i != null && (e.checked = i && typeof i != "function" && typeof i != "symbol"),
        v != null && typeof v != "function" && typeof v != "symbol" && typeof v != "boolean" ? e.name = "" + St(v) : e.removeAttribute("name")
    }
    function pc(e, t, n, l, i, o, h, v) {
        if (o != null && typeof o != "function" && typeof o != "symbol" && typeof o != "boolean" && (e.type = o),
        t != null || n != null) {
            if (!(o !== "submit" && o !== "reset" || t != null)) {
                Fs(e);
                return
            }
            n = n != null ? "" + St(n) : "",
            t = t != null ? "" + St(t) : n,
            v || t === e.value || (e.value = t),
            e.defaultValue = t
        }
        l = l ?? i,
        l = typeof l != "function" && typeof l != "symbol" && !!l,
        e.checked = v ? e.checked : !!l,
        e.defaultChecked = !!l,
        h != null && typeof h != "function" && typeof h != "symbol" && typeof h != "boolean" && (e.name = h),
        Fs(e)
    }
    function Is(e, t, n) {
        t === "number" && ci(e.ownerDocument) === e || e.defaultValue === "" + n || (e.defaultValue = "" + n)
    }
    function rl(e, t, n, l) {
        if (e = e.options,
        t) {
            t = {};
            for (var i = 0; i < n.length; i++)
                t["$" + n[i]] = !0;
            for (n = 0; n < e.length; n++)
                i = t.hasOwnProperty("$" + e[n].value),
                e[n].selected !== i && (e[n].selected = i),
                i && l && (e[n].defaultSelected = !0)
        } else {
            for (n = "" + St(n),
            t = null,
            i = 0; i < e.length; i++) {
                if (e[i].value === n) {
                    e[i].selected = !0,
                    l && (e[i].defaultSelected = !0);
                    return
                }
                t !== null || e[i].disabled || (t = e[i])
            }
            t !== null && (t.selected = !0)
        }
    }
    function yc(e, t, n) {
        if (t != null && (t = "" + St(t),
        t !== e.value && (e.value = t),
        n == null)) {
            e.defaultValue !== t && (e.defaultValue = t);
            return
        }
        e.defaultValue = n != null ? "" + St(n) : ""
    }
    function vc(e, t, n, l) {
        if (t == null) {
            if (l != null) {
                if (n != null)
                    throw Error(u(92));
                if (fe(l)) {
                    if (1 < l.length)
                        throw Error(u(93));
                    l = l[0]
                }
                n = l
            }
            n == null && (n = ""),
            t = n
        }
        n = St(t),
        e.defaultValue = n,
        l = e.textContent,
        l === n && l !== "" && l !== null && (e.value = l),
        Fs(e)
    }
    function ul(e, t) {
        if (t) {
            var n = e.firstChild;
            if (n && n === e.lastChild && n.nodeType === 3) {
                n.nodeValue = t;
                return
            }
        }
        e.textContent = t
    }
    var Rp = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
    function xc(e, t, n) {
        var l = t.indexOf("--") === 0;
        n == null || typeof n == "boolean" || n === "" ? l ? e.setProperty(t, "") : t === "float" ? e.cssFloat = "" : e[t] = "" : l ? e.setProperty(t, n) : typeof n != "number" || n === 0 || Rp.has(t) ? t === "float" ? e.cssFloat = n : e[t] = ("" + n).trim() : e[t] = n + "px"
    }
    function bc(e, t, n) {
        if (t != null && typeof t != "object")
            throw Error(u(62));
        if (e = e.style,
        n != null) {
            for (var l in n)
                !n.hasOwnProperty(l) || t != null && t.hasOwnProperty(l) || (l.indexOf("--") === 0 ? e.setProperty(l, "") : l === "float" ? e.cssFloat = "" : e[l] = "");
            for (var i in t)
                l = t[i],
                t.hasOwnProperty(i) && n[i] !== l && xc(e, i, l)
        } else
            for (var o in t)
                t.hasOwnProperty(o) && xc(e, o, t[o])
    }
    function Ps(e) {
        if (e.indexOf("-") === -1)
            return !1;
        switch (e) {
        case "annotation-xml":
        case "color-profile":
        case "font-face":
        case "font-face-src":
        case "font-face-uri":
        case "font-face-format":
        case "font-face-name":
        case "missing-glyph":
            return !1;
        default:
            return !0
        }
    }
    var Mp = new Map([["acceptCharset", "accept-charset"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"], ["crossOrigin", "crossorigin"], ["accentHeight", "accent-height"], ["alignmentBaseline", "alignment-baseline"], ["arabicForm", "arabic-form"], ["baselineShift", "baseline-shift"], ["capHeight", "cap-height"], ["clipPath", "clip-path"], ["clipRule", "clip-rule"], ["colorInterpolation", "color-interpolation"], ["colorInterpolationFilters", "color-interpolation-filters"], ["colorProfile", "color-profile"], ["colorRendering", "color-rendering"], ["dominantBaseline", "dominant-baseline"], ["enableBackground", "enable-background"], ["fillOpacity", "fill-opacity"], ["fillRule", "fill-rule"], ["floodColor", "flood-color"], ["floodOpacity", "flood-opacity"], ["fontFamily", "font-family"], ["fontSize", "font-size"], ["fontSizeAdjust", "font-size-adjust"], ["fontStretch", "font-stretch"], ["fontStyle", "font-style"], ["fontVariant", "font-variant"], ["fontWeight", "font-weight"], ["glyphName", "glyph-name"], ["glyphOrientationHorizontal", "glyph-orientation-horizontal"], ["glyphOrientationVertical", "glyph-orientation-vertical"], ["horizAdvX", "horiz-adv-x"], ["horizOriginX", "horiz-origin-x"], ["imageRendering", "image-rendering"], ["letterSpacing", "letter-spacing"], ["lightingColor", "lighting-color"], ["markerEnd", "marker-end"], ["markerMid", "marker-mid"], ["markerStart", "marker-start"], ["overlinePosition", "overline-position"], ["overlineThickness", "overline-thickness"], ["paintOrder", "paint-order"], ["panose-1", "panose-1"], ["pointerEvents", "pointer-events"], ["renderingIntent", "rendering-intent"], ["shapeRendering", "shape-rendering"], ["stopColor", "stop-color"], ["stopOpacity", "stop-opacity"], ["strikethroughPosition", "strikethrough-position"], ["strikethroughThickness", "strikethrough-thickness"], ["strokeDasharray", "stroke-dasharray"], ["strokeDashoffset", "stroke-dashoffset"], ["strokeLinecap", "stroke-linecap"], ["strokeLinejoin", "stroke-linejoin"], ["strokeMiterlimit", "stroke-miterlimit"], ["strokeOpacity", "stroke-opacity"], ["strokeWidth", "stroke-width"], ["textAnchor", "text-anchor"], ["textDecoration", "text-decoration"], ["textRendering", "text-rendering"], ["transformOrigin", "transform-origin"], ["underlinePosition", "underline-position"], ["underlineThickness", "underline-thickness"], ["unicodeBidi", "unicode-bidi"], ["unicodeRange", "unicode-range"], ["unitsPerEm", "units-per-em"], ["vAlphabetic", "v-alphabetic"], ["vHanging", "v-hanging"], ["vIdeographic", "v-ideographic"], ["vMathematical", "v-mathematical"], ["vectorEffect", "vector-effect"], ["vertAdvY", "vert-adv-y"], ["vertOriginX", "vert-origin-x"], ["vertOriginY", "vert-origin-y"], ["wordSpacing", "word-spacing"], ["writingMode", "writing-mode"], ["xmlnsXlink", "xmlns:xlink"], ["xHeight", "x-height"]])
      , Lp = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
    function fi(e) {
        return Lp.test("" + e) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : e
    }
    function Xt() {}
    var er = null;
    function tr(e) {
        return e = e.target || e.srcElement || window,
        e.correspondingUseElement && (e = e.correspondingUseElement),
        e.nodeType === 3 ? e.parentNode : e
    }
    var ol = null
      , cl = null;
    function Sc(e) {
        var t = al(e);
        if (t && (e = t.stateNode)) {
            var n = e[at] || null;
            e: switch (e = t.stateNode,
            t.type) {
            case "input":
                if (Ws(e, n.value, n.defaultValue, n.defaultValue, n.checked, n.defaultChecked, n.type, n.name),
                t = n.name,
                n.type === "radio" && t != null) {
                    for (n = e; n.parentNode; )
                        n = n.parentNode;
                    for (n = n.querySelectorAll('input[name="' + Et("" + t) + '"][type="radio"]'),
                    t = 0; t < n.length; t++) {
                        var l = n[t];
                        if (l !== e && l.form === e.form) {
                            var i = l[at] || null;
                            if (!i)
                                throw Error(u(90));
                            Ws(l, i.value, i.defaultValue, i.defaultValue, i.checked, i.defaultChecked, i.type, i.name)
                        }
                    }
                    for (t = 0; t < n.length; t++)
                        l = n[t],
                        l.form === e.form && gc(l)
                }
                break e;
            case "textarea":
                yc(e, n.value, n.defaultValue);
                break e;
            case "select":
                t = n.value,
                t != null && rl(e, !!n.multiple, t, !1)
            }
        }
    }
    var nr = !1;
    function Ec(e, t, n) {
        if (nr)
            return e(t, n);
        nr = !0;
        try {
            var l = e(t);
            return l
        } finally {
            if (nr = !1,
            (ol !== null || cl !== null) && (Ii(),
            ol && (t = ol,
            e = cl,
            cl = ol = null,
            Sc(t),
            e)))
                for (t = 0; t < e.length; t++)
                    Sc(e[t])
        }
    }
    function Pl(e, t) {
        var n = e.stateNode;
        if (n === null)
            return null;
        var l = n[at] || null;
        if (l === null)
            return null;
        n = l[t];
        e: switch (t) {
        case "onClick":
        case "onClickCapture":
        case "onDoubleClick":
        case "onDoubleClickCapture":
        case "onMouseDown":
        case "onMouseDownCapture":
        case "onMouseMove":
        case "onMouseMoveCapture":
        case "onMouseUp":
        case "onMouseUpCapture":
        case "onMouseEnter":
            (l = !l.disabled) || (e = e.type,
            l = !(e === "button" || e === "input" || e === "select" || e === "textarea")),
            e = !l;
            break e;
        default:
            e = !1
        }
        if (e)
            return null;
        if (n && typeof n != "function")
            throw Error(u(231, t, typeof n));
        return n
    }
    var Kt = !(typeof window > "u" || typeof window.document > "u" || typeof window.document.createElement > "u")
      , lr = !1;
    if (Kt)
        try {
            var ea = {};
            Object.defineProperty(ea, "passive", {
                get: function() {
                    lr = !0
                }
            }),
            window.addEventListener("test", ea, ea),
            window.removeEventListener("test", ea, ea)
        } catch {
            lr = !1
        }
    var mn = null
      , ar = null
      , di = null;
    function wc() {
        if (di)
            return di;
        var e, t = ar, n = t.length, l, i = "value"in mn ? mn.value : mn.textContent, o = i.length;
        for (e = 0; e < n && t[e] === i[e]; e++)
            ;
        var h = n - e;
        for (l = 1; l <= h && t[n - l] === i[o - l]; l++)
            ;
        return di = i.slice(e, 1 < l ? 1 - l : void 0)
    }
    function hi(e) {
        var t = e.keyCode;
        return "charCode"in e ? (e = e.charCode,
        e === 0 && t === 13 && (e = 13)) : e = t,
        e === 10 && (e = 13),
        32 <= e || e === 13 ? e : 0
    }
    function mi() {
        return !0
    }
    function _c() {
        return !1
    }
    function it(e) {
        function t(n, l, i, o, h) {
            this._reactName = n,
            this._targetInst = i,
            this.type = l,
            this.nativeEvent = o,
            this.target = h,
            this.currentTarget = null;
            for (var v in e)
                e.hasOwnProperty(v) && (n = e[v],
                this[v] = n ? n(o) : o[v]);
            return this.isDefaultPrevented = (o.defaultPrevented != null ? o.defaultPrevented : o.returnValue === !1) ? mi : _c,
            this.isPropagationStopped = _c,
            this
        }
        return x(t.prototype, {
            preventDefault: function() {
                this.defaultPrevented = !0;
                var n = this.nativeEvent;
                n && (n.preventDefault ? n.preventDefault() : typeof n.returnValue != "unknown" && (n.returnValue = !1),
                this.isDefaultPrevented = mi)
            },
            stopPropagation: function() {
                var n = this.nativeEvent;
                n && (n.stopPropagation ? n.stopPropagation() : typeof n.cancelBubble != "unknown" && (n.cancelBubble = !0),
                this.isPropagationStopped = mi)
            },
            persist: function() {},
            isPersistent: mi
        }),
        t
    }
    var Gn = {
        eventPhase: 0,
        bubbles: 0,
        cancelable: 0,
        timeStamp: function(e) {
            return e.timeStamp || Date.now()
        },
        defaultPrevented: 0,
        isTrusted: 0
    }, gi = it(Gn), ta = x({}, Gn, {
        view: 0,
        detail: 0
    }), zp = it(ta), ir, sr, na, pi = x({}, ta, {
        screenX: 0,
        screenY: 0,
        clientX: 0,
        clientY: 0,
        pageX: 0,
        pageY: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        getModifierState: ur,
        button: 0,
        buttons: 0,
        relatedTarget: function(e) {
            return e.relatedTarget === void 0 ? e.fromElement === e.srcElement ? e.toElement : e.fromElement : e.relatedTarget
        },
        movementX: function(e) {
            return "movementX"in e ? e.movementX : (e !== na && (na && e.type === "mousemove" ? (ir = e.screenX - na.screenX,
            sr = e.screenY - na.screenY) : sr = ir = 0,
            na = e),
            ir)
        },
        movementY: function(e) {
            return "movementY"in e ? e.movementY : sr
        }
    }), Cc = it(pi), Dp = x({}, pi, {
        dataTransfer: 0
    }), Up = it(Dp), Hp = x({}, ta, {
        relatedTarget: 0
    }), rr = it(Hp), Bp = x({}, Gn, {
        animationName: 0,
        elapsedTime: 0,
        pseudoElement: 0
    }), qp = it(Bp), Gp = x({}, Gn, {
        clipboardData: function(e) {
            return "clipboardData"in e ? e.clipboardData : window.clipboardData
        }
    }), Yp = it(Gp), Vp = x({}, Gn, {
        data: 0
    }), Nc = it(Vp), kp = {
        Esc: "Escape",
        Spacebar: " ",
        Left: "ArrowLeft",
        Up: "ArrowUp",
        Right: "ArrowRight",
        Down: "ArrowDown",
        Del: "Delete",
        Win: "OS",
        Menu: "ContextMenu",
        Apps: "ContextMenu",
        Scroll: "ScrollLock",
        MozPrintableKey: "Unidentified"
    }, Qp = {
        8: "Backspace",
        9: "Tab",
        12: "Clear",
        13: "Enter",
        16: "Shift",
        17: "Control",
        18: "Alt",
        19: "Pause",
        20: "CapsLock",
        27: "Escape",
        32: " ",
        33: "PageUp",
        34: "PageDown",
        35: "End",
        36: "Home",
        37: "ArrowLeft",
        38: "ArrowUp",
        39: "ArrowRight",
        40: "ArrowDown",
        45: "Insert",
        46: "Delete",
        112: "F1",
        113: "F2",
        114: "F3",
        115: "F4",
        116: "F5",
        117: "F6",
        118: "F7",
        119: "F8",
        120: "F9",
        121: "F10",
        122: "F11",
        123: "F12",
        144: "NumLock",
        145: "ScrollLock",
        224: "Meta"
    }, Xp = {
        Alt: "altKey",
        Control: "ctrlKey",
        Meta: "metaKey",
        Shift: "shiftKey"
    };
    function Kp(e) {
        var t = this.nativeEvent;
        return t.getModifierState ? t.getModifierState(e) : (e = Xp[e]) ? !!t[e] : !1
    }
    function ur() {
        return Kp
    }
    var Zp = x({}, ta, {
        key: function(e) {
            if (e.key) {
                var t = kp[e.key] || e.key;
                if (t !== "Unidentified")
                    return t
            }
            return e.type === "keypress" ? (e = hi(e),
            e === 13 ? "Enter" : String.fromCharCode(e)) : e.type === "keydown" || e.type === "keyup" ? Qp[e.keyCode] || "Unidentified" : ""
        },
        code: 0,
        location: 0,
        ctrlKey: 0,
        shiftKey: 0,
        altKey: 0,
        metaKey: 0,
        repeat: 0,
        locale: 0,
        getModifierState: ur,
        charCode: function(e) {
            return e.type === "keypress" ? hi(e) : 0
        },
        keyCode: function(e) {
            return e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0
        },
        which: function(e) {
            return e.type === "keypress" ? hi(e) : e.type === "keydown" || e.type === "keyup" ? e.keyCode : 0
        }
    })
      , Jp = it(Zp)
      , $p = x({}, pi, {
        pointerId: 0,
        width: 0,
        height: 0,
        pressure: 0,
        tangentialPressure: 0,
        tiltX: 0,
        tiltY: 0,
        twist: 0,
        pointerType: 0,
        isPrimary: 0
    })
      , Tc = it($p)
      , Fp = x({}, ta, {
        touches: 0,
        targetTouches: 0,
        changedTouches: 0,
        altKey: 0,
        metaKey: 0,
        ctrlKey: 0,
        shiftKey: 0,
        getModifierState: ur
    })
      , Wp = it(Fp)
      , Ip = x({}, Gn, {
        propertyName: 0,
        elapsedTime: 0,
        pseudoElement: 0
    })
      , Pp = it(Ip)
      , e0 = x({}, pi, {
        deltaX: function(e) {
            return "deltaX"in e ? e.deltaX : "wheelDeltaX"in e ? -e.wheelDeltaX : 0
        },
        deltaY: function(e) {
            return "deltaY"in e ? e.deltaY : "wheelDeltaY"in e ? -e.wheelDeltaY : "wheelDelta"in e ? -e.wheelDelta : 0
        },
        deltaZ: 0,
        deltaMode: 0
    })
      , t0 = it(e0)
      , n0 = x({}, Gn, {
        newState: 0,
        oldState: 0
    })
      , l0 = it(n0)
      , a0 = [9, 13, 27, 32]
      , or = Kt && "CompositionEvent"in window
      , la = null;
    Kt && "documentMode"in document && (la = document.documentMode);
    var i0 = Kt && "TextEvent"in window && !la
      , jc = Kt && (!or || la && 8 < la && 11 >= la)
      , Oc = " "
      , Ac = !1;
    function Rc(e, t) {
        switch (e) {
        case "keyup":
            return a0.indexOf(t.keyCode) !== -1;
        case "keydown":
            return t.keyCode !== 229;
        case "keypress":
        case "mousedown":
        case "focusout":
            return !0;
        default:
            return !1
        }
    }
    function Mc(e) {
        return e = e.detail,
        typeof e == "object" && "data"in e ? e.data : null
    }
    var fl = !1;
    function s0(e, t) {
        switch (e) {
        case "compositionend":
            return Mc(t);
        case "keypress":
            return t.which !== 32 ? null : (Ac = !0,
            Oc);
        case "textInput":
            return e = t.data,
            e === Oc && Ac ? null : e;
        default:
            return null
        }
    }
    function r0(e, t) {
        if (fl)
            return e === "compositionend" || !or && Rc(e, t) ? (e = wc(),
            di = ar = mn = null,
            fl = !1,
            e) : null;
        switch (e) {
        case "paste":
            return null;
        case "keypress":
            if (!(t.ctrlKey || t.altKey || t.metaKey) || t.ctrlKey && t.altKey) {
                if (t.char && 1 < t.char.length)
                    return t.char;
                if (t.which)
                    return String.fromCharCode(t.which)
            }
            return null;
        case "compositionend":
            return jc && t.locale !== "ko" ? null : t.data;
        default:
            return null
        }
    }
    var u0 = {
        color: !0,
        date: !0,
        datetime: !0,
        "datetime-local": !0,
        email: !0,
        month: !0,
        number: !0,
        password: !0,
        range: !0,
        search: !0,
        tel: !0,
        text: !0,
        time: !0,
        url: !0,
        week: !0
    };
    function Lc(e) {
        var t = e && e.nodeName && e.nodeName.toLowerCase();
        return t === "input" ? !!u0[e.type] : t === "textarea"
    }
    function zc(e, t, n, l) {
        ol ? cl ? cl.push(l) : cl = [l] : ol = l,
        t = is(t, "onChange"),
        0 < t.length && (n = new gi("onChange","change",null,n,l),
        e.push({
            event: n,
            listeners: t
        }))
    }
    var aa = null
      , ia = null;
    function o0(e) {
        yh(e, 0)
    }
    function yi(e) {
        var t = Il(e);
        if (gc(t))
            return e
    }
    function Dc(e, t) {
        if (e === "change")
            return t
    }
    var Uc = !1;
    if (Kt) {
        var cr;
        if (Kt) {
            var fr = "oninput"in document;
            if (!fr) {
                var Hc = document.createElement("div");
                Hc.setAttribute("oninput", "return;"),
                fr = typeof Hc.oninput == "function"
            }
            cr = fr
        } else
            cr = !1;
        Uc = cr && (!document.documentMode || 9 < document.documentMode)
    }
    function Bc() {
        aa && (aa.detachEvent("onpropertychange", qc),
        ia = aa = null)
    }
    function qc(e) {
        if (e.propertyName === "value" && yi(ia)) {
            var t = [];
            zc(t, ia, e, tr(e)),
            Ec(o0, t)
        }
    }
    function c0(e, t, n) {
        e === "focusin" ? (Bc(),
        aa = t,
        ia = n,
        aa.attachEvent("onpropertychange", qc)) : e === "focusout" && Bc()
    }
    function f0(e) {
        if (e === "selectionchange" || e === "keyup" || e === "keydown")
            return yi(ia)
    }
    function d0(e, t) {
        if (e === "click")
            return yi(t)
    }
    function h0(e, t) {
        if (e === "input" || e === "change")
            return yi(t)
    }
    function m0(e, t) {
        return e === t && (e !== 0 || 1 / e === 1 / t) || e !== e && t !== t
    }
    var mt = typeof Object.is == "function" ? Object.is : m0;
    function sa(e, t) {
        if (mt(e, t))
            return !0;
        if (typeof e != "object" || e === null || typeof t != "object" || t === null)
            return !1;
        var n = Object.keys(e)
          , l = Object.keys(t);
        if (n.length !== l.length)
            return !1;
        for (l = 0; l < n.length; l++) {
            var i = n[l];
            if (!Vs.call(t, i) || !mt(e[i], t[i]))
                return !1
        }
        return !0
    }
    function Gc(e) {
        for (; e && e.firstChild; )
            e = e.firstChild;
        return e
    }
    function Yc(e, t) {
        var n = Gc(e);
        e = 0;
        for (var l; n; ) {
            if (n.nodeType === 3) {
                if (l = e + n.textContent.length,
                e <= t && l >= t)
                    return {
                        node: n,
                        offset: t - e
                    };
                e = l
            }
            e: {
                for (; n; ) {
                    if (n.nextSibling) {
                        n = n.nextSibling;
                        break e
                    }
                    n = n.parentNode
                }
                n = void 0
            }
            n = Gc(n)
        }
    }
    function Vc(e, t) {
        return e && t ? e === t ? !0 : e && e.nodeType === 3 ? !1 : t && t.nodeType === 3 ? Vc(e, t.parentNode) : "contains"in e ? e.contains(t) : e.compareDocumentPosition ? !!(e.compareDocumentPosition(t) & 16) : !1 : !1
    }
    function kc(e) {
        e = e != null && e.ownerDocument != null && e.ownerDocument.defaultView != null ? e.ownerDocument.defaultView : window;
        for (var t = ci(e.document); t instanceof e.HTMLIFrameElement; ) {
            try {
                var n = typeof t.contentWindow.location.href == "string"
            } catch {
                n = !1
            }
            if (n)
                e = t.contentWindow;
            else
                break;
            t = ci(e.document)
        }
        return t
    }
    function dr(e) {
        var t = e && e.nodeName && e.nodeName.toLowerCase();
        return t && (t === "input" && (e.type === "text" || e.type === "search" || e.type === "tel" || e.type === "url" || e.type === "password") || t === "textarea" || e.contentEditable === "true")
    }
    var g0 = Kt && "documentMode"in document && 11 >= document.documentMode
      , dl = null
      , hr = null
      , ra = null
      , mr = !1;
    function Qc(e, t, n) {
        var l = n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
        mr || dl == null || dl !== ci(l) || (l = dl,
        "selectionStart"in l && dr(l) ? l = {
            start: l.selectionStart,
            end: l.selectionEnd
        } : (l = (l.ownerDocument && l.ownerDocument.defaultView || window).getSelection(),
        l = {
            anchorNode: l.anchorNode,
            anchorOffset: l.anchorOffset,
            focusNode: l.focusNode,
            focusOffset: l.focusOffset
        }),
        ra && sa(ra, l) || (ra = l,
        l = is(hr, "onSelect"),
        0 < l.length && (t = new gi("onSelect","select",null,t,n),
        e.push({
            event: t,
            listeners: l
        }),
        t.target = dl)))
    }
    function Yn(e, t) {
        var n = {};
        return n[e.toLowerCase()] = t.toLowerCase(),
        n["Webkit" + e] = "webkit" + t,
        n["Moz" + e] = "moz" + t,
        n
    }
    var hl = {
        animationend: Yn("Animation", "AnimationEnd"),
        animationiteration: Yn("Animation", "AnimationIteration"),
        animationstart: Yn("Animation", "AnimationStart"),
        transitionrun: Yn("Transition", "TransitionRun"),
        transitionstart: Yn("Transition", "TransitionStart"),
        transitioncancel: Yn("Transition", "TransitionCancel"),
        transitionend: Yn("Transition", "TransitionEnd")
    }
      , gr = {}
      , Xc = {};
    Kt && (Xc = document.createElement("div").style,
    "AnimationEvent"in window || (delete hl.animationend.animation,
    delete hl.animationiteration.animation,
    delete hl.animationstart.animation),
    "TransitionEvent"in window || delete hl.transitionend.transition);
    function Vn(e) {
        if (gr[e])
            return gr[e];
        if (!hl[e])
            return e;
        var t = hl[e], n;
        for (n in t)
            if (t.hasOwnProperty(n) && n in Xc)
                return gr[e] = t[n];
        return e
    }
    var Kc = Vn("animationend")
      , Zc = Vn("animationiteration")
      , Jc = Vn("animationstart")
      , p0 = Vn("transitionrun")
      , y0 = Vn("transitionstart")
      , v0 = Vn("transitioncancel")
      , $c = Vn("transitionend")
      , Fc = new Map
      , pr = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
    pr.push("scrollEnd");
    function Mt(e, t) {
        Fc.set(e, t),
        qn(t, [e])
    }
    var vi = typeof reportError == "function" ? reportError : function(e) {
        if (typeof window == "object" && typeof window.ErrorEvent == "function") {
            var t = new window.ErrorEvent("error",{
                bubbles: !0,
                cancelable: !0,
                message: typeof e == "object" && e !== null && typeof e.message == "string" ? String(e.message) : String(e),
                error: e
            });
            if (!window.dispatchEvent(t))
                return
        } else if (typeof process == "object" && typeof process.emit == "function") {
            process.emit("uncaughtException", e);
            return
        }
        console.error(e)
    }
      , wt = []
      , ml = 0
      , yr = 0;
    function xi() {
        for (var e = ml, t = yr = ml = 0; t < e; ) {
            var n = wt[t];
            wt[t++] = null;
            var l = wt[t];
            wt[t++] = null;
            var i = wt[t];
            wt[t++] = null;
            var o = wt[t];
            if (wt[t++] = null,
            l !== null && i !== null) {
                var h = l.pending;
                h === null ? i.next = i : (i.next = h.next,
                h.next = i),
                l.pending = i
            }
            o !== 0 && Wc(n, i, o)
        }
    }
    function bi(e, t, n, l) {
        wt[ml++] = e,
        wt[ml++] = t,
        wt[ml++] = n,
        wt[ml++] = l,
        yr |= l,
        e.lanes |= l,
        e = e.alternate,
        e !== null && (e.lanes |= l)
    }
    function vr(e, t, n, l) {
        return bi(e, t, n, l),
        Si(e)
    }
    function kn(e, t) {
        return bi(e, null, null, t),
        Si(e)
    }
    function Wc(e, t, n) {
        e.lanes |= n;
        var l = e.alternate;
        l !== null && (l.lanes |= n);
        for (var i = !1, o = e.return; o !== null; )
            o.childLanes |= n,
            l = o.alternate,
            l !== null && (l.childLanes |= n),
            o.tag === 22 && (e = o.stateNode,
            e === null || e._visibility & 1 || (i = !0)),
            e = o,
            o = o.return;
        return e.tag === 3 ? (o = e.stateNode,
        i && t !== null && (i = 31 - ht(n),
        e = o.hiddenUpdates,
        l = e[i],
        l === null ? e[i] = [t] : l.push(t),
        t.lane = n | 536870912),
        o) : null
    }
    function Si(e) {
        if (50 < Oa)
            throw Oa = 0,
            Tu = null,
            Error(u(185));
        for (var t = e.return; t !== null; )
            e = t,
            t = e.return;
        return e.tag === 3 ? e.stateNode : null
    }
    var gl = {};
    function x0(e, t, n, l) {
        this.tag = e,
        this.key = n,
        this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null,
        this.index = 0,
        this.refCleanup = this.ref = null,
        this.pendingProps = t,
        this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null,
        this.mode = l,
        this.subtreeFlags = this.flags = 0,
        this.deletions = null,
        this.childLanes = this.lanes = 0,
        this.alternate = null
    }
    function gt(e, t, n, l) {
        return new x0(e,t,n,l)
    }
    function xr(e) {
        return e = e.prototype,
        !(!e || !e.isReactComponent)
    }
    function Zt(e, t) {
        var n = e.alternate;
        return n === null ? (n = gt(e.tag, t, e.key, e.mode),
        n.elementType = e.elementType,
        n.type = e.type,
        n.stateNode = e.stateNode,
        n.alternate = e,
        e.alternate = n) : (n.pendingProps = t,
        n.type = e.type,
        n.flags = 0,
        n.subtreeFlags = 0,
        n.deletions = null),
        n.flags = e.flags & 65011712,
        n.childLanes = e.childLanes,
        n.lanes = e.lanes,
        n.child = e.child,
        n.memoizedProps = e.memoizedProps,
        n.memoizedState = e.memoizedState,
        n.updateQueue = e.updateQueue,
        t = e.dependencies,
        n.dependencies = t === null ? null : {
            lanes: t.lanes,
            firstContext: t.firstContext
        },
        n.sibling = e.sibling,
        n.index = e.index,
        n.ref = e.ref,
        n.refCleanup = e.refCleanup,
        n
    }
    function Ic(e, t) {
        e.flags &= 65011714;
        var n = e.alternate;
        return n === null ? (e.childLanes = 0,
        e.lanes = t,
        e.child = null,
        e.subtreeFlags = 0,
        e.memoizedProps = null,
        e.memoizedState = null,
        e.updateQueue = null,
        e.dependencies = null,
        e.stateNode = null) : (e.childLanes = n.childLanes,
        e.lanes = n.lanes,
        e.child = n.child,
        e.subtreeFlags = 0,
        e.deletions = null,
        e.memoizedProps = n.memoizedProps,
        e.memoizedState = n.memoizedState,
        e.updateQueue = n.updateQueue,
        e.type = n.type,
        t = n.dependencies,
        e.dependencies = t === null ? null : {
            lanes: t.lanes,
            firstContext: t.firstContext
        }),
        e
    }
    function Ei(e, t, n, l, i, o) {
        var h = 0;
        if (l = e,
        typeof e == "function")
            xr(e) && (h = 1);
        else if (typeof e == "string")
            h = _y(e, n, $.current) ? 26 : e === "html" || e === "head" || e === "body" ? 27 : 5;
        else
            e: switch (e) {
            case Ce:
                return e = gt(31, n, t, i),
                e.elementType = Ce,
                e.lanes = o,
                e;
            case j:
                return Qn(n.children, i, o, t);
            case _:
                h = 8,
                i |= 24;
                break;
            case L:
                return e = gt(12, n, t, i | 2),
                e.elementType = L,
                e.lanes = o,
                e;
            case W:
                return e = gt(13, n, t, i),
                e.elementType = W,
                e.lanes = o,
                e;
            case ue:
                return e = gt(19, n, t, i),
                e.elementType = ue,
                e.lanes = o,
                e;
            default:
                if (typeof e == "object" && e !== null)
                    switch (e.$$typeof) {
                    case V:
                        h = 10;
                        break e;
                    case G:
                        h = 9;
                        break e;
                    case J:
                        h = 11;
                        break e;
                    case I:
                        h = 14;
                        break e;
                    case ye:
                        h = 16,
                        l = null;
                        break e
                    }
                h = 29,
                n = Error(u(130, e === null ? "null" : typeof e, "")),
                l = null
            }
        return t = gt(h, n, t, i),
        t.elementType = e,
        t.type = l,
        t.lanes = o,
        t
    }
    function Qn(e, t, n, l) {
        return e = gt(7, e, l, t),
        e.lanes = n,
        e
    }
    function br(e, t, n) {
        return e = gt(6, e, null, t),
        e.lanes = n,
        e
    }
    function Pc(e) {
        var t = gt(18, null, null, 0);
        return t.stateNode = e,
        t
    }
    function Sr(e, t, n) {
        return t = gt(4, e.children !== null ? e.children : [], e.key, t),
        t.lanes = n,
        t.stateNode = {
            containerInfo: e.containerInfo,
            pendingChildren: null,
            implementation: e.implementation
        },
        t
    }
    var ef = new WeakMap;
    function _t(e, t) {
        if (typeof e == "object" && e !== null) {
            var n = ef.get(e);
            return n !== void 0 ? n : (t = {
                value: e,
                source: t,
                stack: Po(t)
            },
            ef.set(e, t),
            t)
        }
        return {
            value: e,
            source: t,
            stack: Po(t)
        }
    }
    var pl = []
      , yl = 0
      , wi = null
      , ua = 0
      , Ct = []
      , Nt = 0
      , gn = null
      , Ut = 1
      , Ht = "";
    function Jt(e, t) {
        pl[yl++] = ua,
        pl[yl++] = wi,
        wi = e,
        ua = t
    }
    function tf(e, t, n) {
        Ct[Nt++] = Ut,
        Ct[Nt++] = Ht,
        Ct[Nt++] = gn,
        gn = e;
        var l = Ut;
        e = Ht;
        var i = 32 - ht(l) - 1;
        l &= ~(1 << i),
        n += 1;
        var o = 32 - ht(t) + i;
        if (30 < o) {
            var h = i - i % 5;
            o = (l & (1 << h) - 1).toString(32),
            l >>= h,
            i -= h,
            Ut = 1 << 32 - ht(t) + i | n << i | l,
            Ht = o + e
        } else
            Ut = 1 << o | n << i | l,
            Ht = e
    }
    function Er(e) {
        e.return !== null && (Jt(e, 1),
        tf(e, 1, 0))
    }
    function wr(e) {
        for (; e === wi; )
            wi = pl[--yl],
            pl[yl] = null,
            ua = pl[--yl],
            pl[yl] = null;
        for (; e === gn; )
            gn = Ct[--Nt],
            Ct[Nt] = null,
            Ht = Ct[--Nt],
            Ct[Nt] = null,
            Ut = Ct[--Nt],
            Ct[Nt] = null
    }
    function nf(e, t) {
        Ct[Nt++] = Ut,
        Ct[Nt++] = Ht,
        Ct[Nt++] = gn,
        Ut = t.id,
        Ht = t.overflow,
        gn = e
    }
    var Fe = null
      , Me = null
      , ve = !1
      , pn = null
      , Tt = !1
      , _r = Error(u(519));
    function yn(e) {
        var t = Error(u(418, 1 < arguments.length && arguments[1] !== void 0 && arguments[1] ? "text" : "HTML", ""));
        throw oa(_t(t, e)),
        _r
    }
    function lf(e) {
        var t = e.stateNode
          , n = e.type
          , l = e.memoizedProps;
        switch (t[$e] = e,
        t[at] = l,
        n) {
        case "dialog":
            me("cancel", t),
            me("close", t);
            break;
        case "iframe":
        case "object":
        case "embed":
            me("load", t);
            break;
        case "video":
        case "audio":
            for (n = 0; n < Ra.length; n++)
                me(Ra[n], t);
            break;
        case "source":
            me("error", t);
            break;
        case "img":
        case "image":
        case "link":
            me("error", t),
            me("load", t);
            break;
        case "details":
            me("toggle", t);
            break;
        case "input":
            me("invalid", t),
            pc(t, l.value, l.defaultValue, l.checked, l.defaultChecked, l.type, l.name, !0);
            break;
        case "select":
            me("invalid", t);
            break;
        case "textarea":
            me("invalid", t),
            vc(t, l.value, l.defaultValue, l.children)
        }
        n = l.children,
        typeof n != "string" && typeof n != "number" && typeof n != "bigint" || t.textContent === "" + n || l.suppressHydrationWarning === !0 || Sh(t.textContent, n) ? (l.popover != null && (me("beforetoggle", t),
        me("toggle", t)),
        l.onScroll != null && me("scroll", t),
        l.onScrollEnd != null && me("scrollend", t),
        l.onClick != null && (t.onclick = Xt),
        t = !0) : t = !1,
        t || yn(e, !0)
    }
    function af(e) {
        for (Fe = e.return; Fe; )
            switch (Fe.tag) {
            case 5:
            case 31:
            case 13:
                Tt = !1;
                return;
            case 27:
            case 3:
                Tt = !0;
                return;
            default:
                Fe = Fe.return
            }
    }
    function vl(e) {
        if (e !== Fe)
            return !1;
        if (!ve)
            return af(e),
            ve = !0,
            !1;
        var t = e.tag, n;
        if ((n = t !== 3 && t !== 27) && ((n = t === 5) && (n = e.type,
        n = !(n !== "form" && n !== "button") || Vu(e.type, e.memoizedProps)),
        n = !n),
        n && Me && yn(e),
        af(e),
        t === 13) {
            if (e = e.memoizedState,
            e = e !== null ? e.dehydrated : null,
            !e)
                throw Error(u(317));
            Me = Ah(e)
        } else if (t === 31) {
            if (e = e.memoizedState,
            e = e !== null ? e.dehydrated : null,
            !e)
                throw Error(u(317));
            Me = Ah(e)
        } else
            t === 27 ? (t = Me,
            Rn(e.type) ? (e = Zu,
            Zu = null,
            Me = e) : Me = t) : Me = Fe ? Ot(e.stateNode.nextSibling) : null;
        return !0
    }
    function Xn() {
        Me = Fe = null,
        ve = !1
    }
    function Cr() {
        var e = pn;
        return e !== null && (ot === null ? ot = e : ot.push.apply(ot, e),
        pn = null),
        e
    }
    function oa(e) {
        pn === null ? pn = [e] : pn.push(e)
    }
    var Nr = N(null)
      , Kn = null
      , $t = null;
    function vn(e, t, n) {
        K(Nr, t._currentValue),
        t._currentValue = n
    }
    function Ft(e) {
        e._currentValue = Nr.current,
        B(Nr)
    }
    function Tr(e, t, n) {
        for (; e !== null; ) {
            var l = e.alternate;
            if ((e.childLanes & t) !== t ? (e.childLanes |= t,
            l !== null && (l.childLanes |= t)) : l !== null && (l.childLanes & t) !== t && (l.childLanes |= t),
            e === n)
                break;
            e = e.return
        }
    }
    function jr(e, t, n, l) {
        var i = e.child;
        for (i !== null && (i.return = e); i !== null; ) {
            var o = i.dependencies;
            if (o !== null) {
                var h = i.child;
                o = o.firstContext;
                e: for (; o !== null; ) {
                    var v = o;
                    o = i;
                    for (var C = 0; C < t.length; C++)
                        if (v.context === t[C]) {
                            o.lanes |= n,
                            v = o.alternate,
                            v !== null && (v.lanes |= n),
                            Tr(o.return, n, e),
                            l || (h = null);
                            break e
                        }
                    o = v.next
                }
            } else if (i.tag === 18) {
                if (h = i.return,
                h === null)
                    throw Error(u(341));
                h.lanes |= n,
                o = h.alternate,
                o !== null && (o.lanes |= n),
                Tr(h, n, e),
                h = null
            } else
                h = i.child;
            if (h !== null)
                h.return = i;
            else
                for (h = i; h !== null; ) {
                    if (h === e) {
                        h = null;
                        break
                    }
                    if (i = h.sibling,
                    i !== null) {
                        i.return = h.return,
                        h = i;
                        break
                    }
                    h = h.return
                }
            i = h
        }
    }
    function xl(e, t, n, l) {
        e = null;
        for (var i = t, o = !1; i !== null; ) {
            if (!o) {
                if ((i.flags & 524288) !== 0)
                    o = !0;
                else if ((i.flags & 262144) !== 0)
                    break
            }
            if (i.tag === 10) {
                var h = i.alternate;
                if (h === null)
                    throw Error(u(387));
                if (h = h.memoizedProps,
                h !== null) {
                    var v = i.type;
                    mt(i.pendingProps.value, h.value) || (e !== null ? e.push(v) : e = [v])
                }
            } else if (i === _e.current) {
                if (h = i.alternate,
                h === null)
                    throw Error(u(387));
                h.memoizedState.memoizedState !== i.memoizedState.memoizedState && (e !== null ? e.push(Ua) : e = [Ua])
            }
            i = i.return
        }
        e !== null && jr(t, e, n, l),
        t.flags |= 262144
    }
    function _i(e) {
        for (e = e.firstContext; e !== null; ) {
            if (!mt(e.context._currentValue, e.memoizedValue))
                return !0;
            e = e.next
        }
        return !1
    }
    function Zn(e) {
        Kn = e,
        $t = null,
        e = e.dependencies,
        e !== null && (e.firstContext = null)
    }
    function We(e) {
        return sf(Kn, e)
    }
    function Ci(e, t) {
        return Kn === null && Zn(e),
        sf(e, t)
    }
    function sf(e, t) {
        var n = t._currentValue;
        if (t = {
            context: t,
            memoizedValue: n,
            next: null
        },
        $t === null) {
            if (e === null)
                throw Error(u(308));
            $t = t,
            e.dependencies = {
                lanes: 0,
                firstContext: t
            },
            e.flags |= 524288
        } else
            $t = $t.next = t;
        return n
    }
    var b0 = typeof AbortController < "u" ? AbortController : function() {
        var e = []
          , t = this.signal = {
            aborted: !1,
            addEventListener: function(n, l) {
                e.push(l)
            }
        };
        this.abort = function() {
            t.aborted = !0,
            e.forEach(function(n) {
                return n()
            })
        }
    }
      , S0 = s.unstable_scheduleCallback
      , E0 = s.unstable_NormalPriority
      , Ge = {
        $$typeof: V,
        Consumer: null,
        Provider: null,
        _currentValue: null,
        _currentValue2: null,
        _threadCount: 0
    };
    function Or() {
        return {
            controller: new b0,
            data: new Map,
            refCount: 0
        }
    }
    function ca(e) {
        e.refCount--,
        e.refCount === 0 && S0(E0, function() {
            e.controller.abort()
        })
    }
    var fa = null
      , Ar = 0
      , bl = 0
      , Sl = null;
    function w0(e, t) {
        if (fa === null) {
            var n = fa = [];
            Ar = 0,
            bl = Lu(),
            Sl = {
                status: "pending",
                value: void 0,
                then: function(l) {
                    n.push(l)
                }
            }
        }
        return Ar++,
        t.then(rf, rf),
        t
    }
    function rf() {
        if (--Ar === 0 && fa !== null) {
            Sl !== null && (Sl.status = "fulfilled");
            var e = fa;
            fa = null,
            bl = 0,
            Sl = null;
            for (var t = 0; t < e.length; t++)
                (0,
                e[t])()
        }
    }
    function _0(e, t) {
        var n = []
          , l = {
            status: "pending",
            value: null,
            reason: null,
            then: function(i) {
                n.push(i)
            }
        };
        return e.then(function() {
            l.status = "fulfilled",
            l.value = t;
            for (var i = 0; i < n.length; i++)
                (0,
                n[i])(t)
        }, function(i) {
            for (l.status = "rejected",
            l.reason = i,
            i = 0; i < n.length; i++)
                (0,
                n[i])(void 0)
        }),
        l
    }
    var uf = D.S;
    D.S = function(e, t) {
        Xd = ft(),
        typeof t == "object" && t !== null && typeof t.then == "function" && w0(e, t),
        uf !== null && uf(e, t)
    }
    ;
    var Jn = N(null);
    function Rr() {
        var e = Jn.current;
        return e !== null ? e : Re.pooledCache
    }
    function Ni(e, t) {
        t === null ? K(Jn, Jn.current) : K(Jn, t.pool)
    }
    function of() {
        var e = Rr();
        return e === null ? null : {
            parent: Ge._currentValue,
            pool: e
        }
    }
    var El = Error(u(460))
      , Mr = Error(u(474))
      , Ti = Error(u(542))
      , ji = {
        then: function() {}
    };
    function cf(e) {
        return e = e.status,
        e === "fulfilled" || e === "rejected"
    }
    function ff(e, t, n) {
        switch (n = e[n],
        n === void 0 ? e.push(t) : n !== t && (t.then(Xt, Xt),
        t = n),
        t.status) {
        case "fulfilled":
            return t.value;
        case "rejected":
            throw e = t.reason,
            hf(e),
            e;
        default:
            if (typeof t.status == "string")
                t.then(Xt, Xt);
            else {
                if (e = Re,
                e !== null && 100 < e.shellSuspendCounter)
                    throw Error(u(482));
                e = t,
                e.status = "pending",
                e.then(function(l) {
                    if (t.status === "pending") {
                        var i = t;
                        i.status = "fulfilled",
                        i.value = l
                    }
                }, function(l) {
                    if (t.status === "pending") {
                        var i = t;
                        i.status = "rejected",
                        i.reason = l
                    }
                })
            }
            switch (t.status) {
            case "fulfilled":
                return t.value;
            case "rejected":
                throw e = t.reason,
                hf(e),
                e
            }
            throw Fn = t,
            El
        }
    }
    function $n(e) {
        try {
            var t = e._init;
            return t(e._payload)
        } catch (n) {
            throw n !== null && typeof n == "object" && typeof n.then == "function" ? (Fn = n,
            El) : n
        }
    }
    var Fn = null;
    function df() {
        if (Fn === null)
            throw Error(u(459));
        var e = Fn;
        return Fn = null,
        e
    }
    function hf(e) {
        if (e === El || e === Ti)
            throw Error(u(483))
    }
    var wl = null
      , da = 0;
    function Oi(e) {
        var t = da;
        return da += 1,
        wl === null && (wl = []),
        ff(wl, e, t)
    }
    function ha(e, t) {
        t = t.props.ref,
        e.ref = t !== void 0 ? t : null
    }
    function Ai(e, t) {
        throw t.$$typeof === E ? Error(u(525)) : (e = Object.prototype.toString.call(t),
        Error(u(31, e === "[object Object]" ? "object with keys {" + Object.keys(t).join(", ") + "}" : e)))
    }
    function mf(e) {
        function t(O, T) {
            if (e) {
                var A = O.deletions;
                A === null ? (O.deletions = [T],
                O.flags |= 16) : A.push(T)
            }
        }
        function n(O, T) {
            if (!e)
                return null;
            for (; T !== null; )
                t(O, T),
                T = T.sibling;
            return null
        }
        function l(O) {
            for (var T = new Map; O !== null; )
                O.key !== null ? T.set(O.key, O) : T.set(O.index, O),
                O = O.sibling;
            return T
        }
        function i(O, T) {
            return O = Zt(O, T),
            O.index = 0,
            O.sibling = null,
            O
        }
        function o(O, T, A) {
            return O.index = A,
            e ? (A = O.alternate,
            A !== null ? (A = A.index,
            A < T ? (O.flags |= 67108866,
            T) : A) : (O.flags |= 67108866,
            T)) : (O.flags |= 1048576,
            T)
        }
        function h(O) {
            return e && O.alternate === null && (O.flags |= 67108866),
            O
        }
        function v(O, T, A, q) {
            return T === null || T.tag !== 6 ? (T = br(A, O.mode, q),
            T.return = O,
            T) : (T = i(T, A),
            T.return = O,
            T)
        }
        function C(O, T, A, q) {
            var ee = A.type;
            return ee === j ? U(O, T, A.props.children, q, A.key) : T !== null && (T.elementType === ee || typeof ee == "object" && ee !== null && ee.$$typeof === ye && $n(ee) === T.type) ? (T = i(T, A.props),
            ha(T, A),
            T.return = O,
            T) : (T = Ei(A.type, A.key, A.props, null, O.mode, q),
            ha(T, A),
            T.return = O,
            T)
        }
        function R(O, T, A, q) {
            return T === null || T.tag !== 4 || T.stateNode.containerInfo !== A.containerInfo || T.stateNode.implementation !== A.implementation ? (T = Sr(A, O.mode, q),
            T.return = O,
            T) : (T = i(T, A.children || []),
            T.return = O,
            T)
        }
        function U(O, T, A, q, ee) {
            return T === null || T.tag !== 7 ? (T = Qn(A, O.mode, q, ee),
            T.return = O,
            T) : (T = i(T, A),
            T.return = O,
            T)
        }
        function Y(O, T, A) {
            if (typeof T == "string" && T !== "" || typeof T == "number" || typeof T == "bigint")
                return T = br("" + T, O.mode, A),
                T.return = O,
                T;
            if (typeof T == "object" && T !== null) {
                switch (T.$$typeof) {
                case S:
                    return A = Ei(T.type, T.key, T.props, null, O.mode, A),
                    ha(A, T),
                    A.return = O,
                    A;
                case w:
                    return T = Sr(T, O.mode, A),
                    T.return = O,
                    T;
                case ye:
                    return T = $n(T),
                    Y(O, T, A)
                }
                if (fe(T) || Z(T))
                    return T = Qn(T, O.mode, A, null),
                    T.return = O,
                    T;
                if (typeof T.then == "function")
                    return Y(O, Oi(T), A);
                if (T.$$typeof === V)
                    return Y(O, Ci(O, T), A);
                Ai(O, T)
            }
            return null
        }
        function M(O, T, A, q) {
            var ee = T !== null ? T.key : null;
            if (typeof A == "string" && A !== "" || typeof A == "number" || typeof A == "bigint")
                return ee !== null ? null : v(O, T, "" + A, q);
            if (typeof A == "object" && A !== null) {
                switch (A.$$typeof) {
                case S:
                    return A.key === ee ? C(O, T, A, q) : null;
                case w:
                    return A.key === ee ? R(O, T, A, q) : null;
                case ye:
                    return A = $n(A),
                    M(O, T, A, q)
                }
                if (fe(A) || Z(A))
                    return ee !== null ? null : U(O, T, A, q, null);
                if (typeof A.then == "function")
                    return M(O, T, Oi(A), q);
                if (A.$$typeof === V)
                    return M(O, T, Ci(O, A), q);
                Ai(O, A)
            }
            return null
        }
        function z(O, T, A, q, ee) {
            if (typeof q == "string" && q !== "" || typeof q == "number" || typeof q == "bigint")
                return O = O.get(A) || null,
                v(T, O, "" + q, ee);
            if (typeof q == "object" && q !== null) {
                switch (q.$$typeof) {
                case S:
                    return O = O.get(q.key === null ? A : q.key) || null,
                    C(T, O, q, ee);
                case w:
                    return O = O.get(q.key === null ? A : q.key) || null,
                    R(T, O, q, ee);
                case ye:
                    return q = $n(q),
                    z(O, T, A, q, ee)
                }
                if (fe(q) || Z(q))
                    return O = O.get(A) || null,
                    U(T, O, q, ee, null);
                if (typeof q.then == "function")
                    return z(O, T, A, Oi(q), ee);
                if (q.$$typeof === V)
                    return z(O, T, A, Ci(T, q), ee);
                Ai(T, q)
            }
            return null
        }
        function F(O, T, A, q) {
            for (var ee = null, be = null, P = T, ce = T = 0, pe = null; P !== null && ce < A.length; ce++) {
                P.index > ce ? (pe = P,
                P = null) : pe = P.sibling;
                var Se = M(O, P, A[ce], q);
                if (Se === null) {
                    P === null && (P = pe);
                    break
                }
                e && P && Se.alternate === null && t(O, P),
                T = o(Se, T, ce),
                be === null ? ee = Se : be.sibling = Se,
                be = Se,
                P = pe
            }
            if (ce === A.length)
                return n(O, P),
                ve && Jt(O, ce),
                ee;
            if (P === null) {
                for (; ce < A.length; ce++)
                    P = Y(O, A[ce], q),
                    P !== null && (T = o(P, T, ce),
                    be === null ? ee = P : be.sibling = P,
                    be = P);
                return ve && Jt(O, ce),
                ee
            }
            for (P = l(P); ce < A.length; ce++)
                pe = z(P, O, ce, A[ce], q),
                pe !== null && (e && pe.alternate !== null && P.delete(pe.key === null ? ce : pe.key),
                T = o(pe, T, ce),
                be === null ? ee = pe : be.sibling = pe,
                be = pe);
            return e && P.forEach(function(Un) {
                return t(O, Un)
            }),
            ve && Jt(O, ce),
            ee
        }
        function le(O, T, A, q) {
            if (A == null)
                throw Error(u(151));
            for (var ee = null, be = null, P = T, ce = T = 0, pe = null, Se = A.next(); P !== null && !Se.done; ce++,
            Se = A.next()) {
                P.index > ce ? (pe = P,
                P = null) : pe = P.sibling;
                var Un = M(O, P, Se.value, q);
                if (Un === null) {
                    P === null && (P = pe);
                    break
                }
                e && P && Un.alternate === null && t(O, P),
                T = o(Un, T, ce),
                be === null ? ee = Un : be.sibling = Un,
                be = Un,
                P = pe
            }
            if (Se.done)
                return n(O, P),
                ve && Jt(O, ce),
                ee;
            if (P === null) {
                for (; !Se.done; ce++,
                Se = A.next())
                    Se = Y(O, Se.value, q),
                    Se !== null && (T = o(Se, T, ce),
                    be === null ? ee = Se : be.sibling = Se,
                    be = Se);
                return ve && Jt(O, ce),
                ee
            }
            for (P = l(P); !Se.done; ce++,
            Se = A.next())
                Se = z(P, O, ce, Se.value, q),
                Se !== null && (e && Se.alternate !== null && P.delete(Se.key === null ? ce : Se.key),
                T = o(Se, T, ce),
                be === null ? ee = Se : be.sibling = Se,
                be = Se);
            return e && P.forEach(function(Dy) {
                return t(O, Dy)
            }),
            ve && Jt(O, ce),
            ee
        }
        function Ae(O, T, A, q) {
            if (typeof A == "object" && A !== null && A.type === j && A.key === null && (A = A.props.children),
            typeof A == "object" && A !== null) {
                switch (A.$$typeof) {
                case S:
                    e: {
                        for (var ee = A.key; T !== null; ) {
                            if (T.key === ee) {
                                if (ee = A.type,
                                ee === j) {
                                    if (T.tag === 7) {
                                        n(O, T.sibling),
                                        q = i(T, A.props.children),
                                        q.return = O,
                                        O = q;
                                        break e
                                    }
                                } else if (T.elementType === ee || typeof ee == "object" && ee !== null && ee.$$typeof === ye && $n(ee) === T.type) {
                                    n(O, T.sibling),
                                    q = i(T, A.props),
                                    ha(q, A),
                                    q.return = O,
                                    O = q;
                                    break e
                                }
                                n(O, T);
                                break
                            } else
                                t(O, T);
                            T = T.sibling
                        }
                        A.type === j ? (q = Qn(A.props.children, O.mode, q, A.key),
                        q.return = O,
                        O = q) : (q = Ei(A.type, A.key, A.props, null, O.mode, q),
                        ha(q, A),
                        q.return = O,
                        O = q)
                    }
                    return h(O);
                case w:
                    e: {
                        for (ee = A.key; T !== null; ) {
                            if (T.key === ee)
                                if (T.tag === 4 && T.stateNode.containerInfo === A.containerInfo && T.stateNode.implementation === A.implementation) {
                                    n(O, T.sibling),
                                    q = i(T, A.children || []),
                                    q.return = O,
                                    O = q;
                                    break e
                                } else {
                                    n(O, T);
                                    break
                                }
                            else
                                t(O, T);
                            T = T.sibling
                        }
                        q = Sr(A, O.mode, q),
                        q.return = O,
                        O = q
                    }
                    return h(O);
                case ye:
                    return A = $n(A),
                    Ae(O, T, A, q)
                }
                if (fe(A))
                    return F(O, T, A, q);
                if (Z(A)) {
                    if (ee = Z(A),
                    typeof ee != "function")
                        throw Error(u(150));
                    return A = ee.call(A),
                    le(O, T, A, q)
                }
                if (typeof A.then == "function")
                    return Ae(O, T, Oi(A), q);
                if (A.$$typeof === V)
                    return Ae(O, T, Ci(O, A), q);
                Ai(O, A)
            }
            return typeof A == "string" && A !== "" || typeof A == "number" || typeof A == "bigint" ? (A = "" + A,
            T !== null && T.tag === 6 ? (n(O, T.sibling),
            q = i(T, A),
            q.return = O,
            O = q) : (n(O, T),
            q = br(A, O.mode, q),
            q.return = O,
            O = q),
            h(O)) : n(O, T)
        }
        return function(O, T, A, q) {
            try {
                da = 0;
                var ee = Ae(O, T, A, q);
                return wl = null,
                ee
            } catch (P) {
                if (P === El || P === Ti)
                    throw P;
                var be = gt(29, P, null, O.mode);
                return be.lanes = q,
                be.return = O,
                be
            }
        }
    }
    var Wn = mf(!0)
      , gf = mf(!1)
      , xn = !1;
    function Lr(e) {
        e.updateQueue = {
            baseState: e.memoizedState,
            firstBaseUpdate: null,
            lastBaseUpdate: null,
            shared: {
                pending: null,
                lanes: 0,
                hiddenCallbacks: null
            },
            callbacks: null
        }
    }
    function zr(e, t) {
        e = e.updateQueue,
        t.updateQueue === e && (t.updateQueue = {
            baseState: e.baseState,
            firstBaseUpdate: e.firstBaseUpdate,
            lastBaseUpdate: e.lastBaseUpdate,
            shared: e.shared,
            callbacks: null
        })
    }
    function bn(e) {
        return {
            lane: e,
            tag: 0,
            payload: null,
            callback: null,
            next: null
        }
    }
    function Sn(e, t, n) {
        var l = e.updateQueue;
        if (l === null)
            return null;
        if (l = l.shared,
        (Ee & 2) !== 0) {
            var i = l.pending;
            return i === null ? t.next = t : (t.next = i.next,
            i.next = t),
            l.pending = t,
            t = Si(e),
            Wc(e, null, n),
            t
        }
        return bi(e, l, t, n),
        Si(e)
    }
    function ma(e, t, n) {
        if (t = t.updateQueue,
        t !== null && (t = t.shared,
        (n & 4194048) !== 0)) {
            var l = t.lanes;
            l &= e.pendingLanes,
            n |= l,
            t.lanes = n,
            ic(e, n)
        }
    }
    function Dr(e, t) {
        var n = e.updateQueue
          , l = e.alternate;
        if (l !== null && (l = l.updateQueue,
        n === l)) {
            var i = null
              , o = null;
            if (n = n.firstBaseUpdate,
            n !== null) {
                do {
                    var h = {
                        lane: n.lane,
                        tag: n.tag,
                        payload: n.payload,
                        callback: null,
                        next: null
                    };
                    o === null ? i = o = h : o = o.next = h,
                    n = n.next
                } while (n !== null);
                o === null ? i = o = t : o = o.next = t
            } else
                i = o = t;
            n = {
                baseState: l.baseState,
                firstBaseUpdate: i,
                lastBaseUpdate: o,
                shared: l.shared,
                callbacks: l.callbacks
            },
            e.updateQueue = n;
            return
        }
        e = n.lastBaseUpdate,
        e === null ? n.firstBaseUpdate = t : e.next = t,
        n.lastBaseUpdate = t
    }
    var Ur = !1;
    function ga() {
        if (Ur) {
            var e = Sl;
            if (e !== null)
                throw e
        }
    }
    function pa(e, t, n, l) {
        Ur = !1;
        var i = e.updateQueue;
        xn = !1;
        var o = i.firstBaseUpdate
          , h = i.lastBaseUpdate
          , v = i.shared.pending;
        if (v !== null) {
            i.shared.pending = null;
            var C = v
              , R = C.next;
            C.next = null,
            h === null ? o = R : h.next = R,
            h = C;
            var U = e.alternate;
            U !== null && (U = U.updateQueue,
            v = U.lastBaseUpdate,
            v !== h && (v === null ? U.firstBaseUpdate = R : v.next = R,
            U.lastBaseUpdate = C))
        }
        if (o !== null) {
            var Y = i.baseState;
            h = 0,
            U = R = C = null,
            v = o;
            do {
                var M = v.lane & -536870913
                  , z = M !== v.lane;
                if (z ? (ge & M) === M : (l & M) === M) {
                    M !== 0 && M === bl && (Ur = !0),
                    U !== null && (U = U.next = {
                        lane: 0,
                        tag: v.tag,
                        payload: v.payload,
                        callback: null,
                        next: null
                    });
                    e: {
                        var F = e
                          , le = v;
                        M = t;
                        var Ae = n;
                        switch (le.tag) {
                        case 1:
                            if (F = le.payload,
                            typeof F == "function") {
                                Y = F.call(Ae, Y, M);
                                break e
                            }
                            Y = F;
                            break e;
                        case 3:
                            F.flags = F.flags & -65537 | 128;
                        case 0:
                            if (F = le.payload,
                            M = typeof F == "function" ? F.call(Ae, Y, M) : F,
                            M == null)
                                break e;
                            Y = x({}, Y, M);
                            break e;
                        case 2:
                            xn = !0
                        }
                    }
                    M = v.callback,
                    M !== null && (e.flags |= 64,
                    z && (e.flags |= 8192),
                    z = i.callbacks,
                    z === null ? i.callbacks = [M] : z.push(M))
                } else
                    z = {
                        lane: M,
                        tag: v.tag,
                        payload: v.payload,
                        callback: v.callback,
                        next: null
                    },
                    U === null ? (R = U = z,
                    C = Y) : U = U.next = z,
                    h |= M;
                if (v = v.next,
                v === null) {
                    if (v = i.shared.pending,
                    v === null)
                        break;
                    z = v,
                    v = z.next,
                    z.next = null,
                    i.lastBaseUpdate = z,
                    i.shared.pending = null
                }
            } while (!0);
            U === null && (C = Y),
            i.baseState = C,
            i.firstBaseUpdate = R,
            i.lastBaseUpdate = U,
            o === null && (i.shared.lanes = 0),
            Nn |= h,
            e.lanes = h,
            e.memoizedState = Y
        }
    }
    function pf(e, t) {
        if (typeof e != "function")
            throw Error(u(191, e));
        e.call(t)
    }
    function yf(e, t) {
        var n = e.callbacks;
        if (n !== null)
            for (e.callbacks = null,
            e = 0; e < n.length; e++)
                pf(n[e], t)
    }
    var _l = N(null)
      , Ri = N(0);
    function vf(e, t) {
        e = sn,
        K(Ri, e),
        K(_l, t),
        sn = e | t.baseLanes
    }
    function Hr() {
        K(Ri, sn),
        K(_l, _l.current)
    }
    function Br() {
        sn = Ri.current,
        B(_l),
        B(Ri)
    }
    var pt = N(null)
      , jt = null;
    function En(e) {
        var t = e.alternate;
        K(Be, Be.current & 1),
        K(pt, e),
        jt === null && (t === null || _l.current !== null || t.memoizedState !== null) && (jt = e)
    }
    function qr(e) {
        K(Be, Be.current),
        K(pt, e),
        jt === null && (jt = e)
    }
    function xf(e) {
        e.tag === 22 ? (K(Be, Be.current),
        K(pt, e),
        jt === null && (jt = e)) : wn()
    }
    function wn() {
        K(Be, Be.current),
        K(pt, pt.current)
    }
    function yt(e) {
        B(pt),
        jt === e && (jt = null),
        B(Be)
    }
    var Be = N(0);
    function Mi(e) {
        for (var t = e; t !== null; ) {
            if (t.tag === 13) {
                var n = t.memoizedState;
                if (n !== null && (n = n.dehydrated,
                n === null || Xu(n) || Ku(n)))
                    return t
            } else if (t.tag === 19 && (t.memoizedProps.revealOrder === "forwards" || t.memoizedProps.revealOrder === "backwards" || t.memoizedProps.revealOrder === "unstable_legacy-backwards" || t.memoizedProps.revealOrder === "together")) {
                if ((t.flags & 128) !== 0)
                    return t
            } else if (t.child !== null) {
                t.child.return = t,
                t = t.child;
                continue
            }
            if (t === e)
                break;
            for (; t.sibling === null; ) {
                if (t.return === null || t.return === e)
                    return null;
                t = t.return
            }
            t.sibling.return = t.return,
            t = t.sibling
        }
        return null
    }
    var Wt = 0
      , re = null
      , je = null
      , Ye = null
      , Li = !1
      , Cl = !1
      , In = !1
      , zi = 0
      , ya = 0
      , Nl = null
      , C0 = 0;
    function De() {
        throw Error(u(321))
    }
    function Gr(e, t) {
        if (t === null)
            return !1;
        for (var n = 0; n < t.length && n < e.length; n++)
            if (!mt(e[n], t[n]))
                return !1;
        return !0
    }
    function Yr(e, t, n, l, i, o) {
        return Wt = o,
        re = t,
        t.memoizedState = null,
        t.updateQueue = null,
        t.lanes = 0,
        D.H = e === null || e.memoizedState === null ? nd : nu,
        In = !1,
        o = n(l, i),
        In = !1,
        Cl && (o = Sf(t, n, l, i)),
        bf(e),
        o
    }
    function bf(e) {
        D.H = ba;
        var t = je !== null && je.next !== null;
        if (Wt = 0,
        Ye = je = re = null,
        Li = !1,
        ya = 0,
        Nl = null,
        t)
            throw Error(u(300));
        e === null || Ve || (e = e.dependencies,
        e !== null && _i(e) && (Ve = !0))
    }
    function Sf(e, t, n, l) {
        re = e;
        var i = 0;
        do {
            if (Cl && (Nl = null),
            ya = 0,
            Cl = !1,
            25 <= i)
                throw Error(u(301));
            if (i += 1,
            Ye = je = null,
            e.updateQueue != null) {
                var o = e.updateQueue;
                o.lastEffect = null,
                o.events = null,
                o.stores = null,
                o.memoCache != null && (o.memoCache.index = 0)
            }
            D.H = ld,
            o = t(n, l)
        } while (Cl);
        return o
    }
    function N0() {
        var e = D.H
          , t = e.useState()[0];
        return t = typeof t.then == "function" ? va(t) : t,
        e = e.useState()[0],
        (je !== null ? je.memoizedState : null) !== e && (re.flags |= 1024),
        t
    }
    function Vr() {
        var e = zi !== 0;
        return zi = 0,
        e
    }
    function kr(e, t, n) {
        t.updateQueue = e.updateQueue,
        t.flags &= -2053,
        e.lanes &= ~n
    }
    function Qr(e) {
        if (Li) {
            for (e = e.memoizedState; e !== null; ) {
                var t = e.queue;
                t !== null && (t.pending = null),
                e = e.next
            }
            Li = !1
        }
        Wt = 0,
        Ye = je = re = null,
        Cl = !1,
        ya = zi = 0,
        Nl = null
    }
    function lt() {
        var e = {
            memoizedState: null,
            baseState: null,
            baseQueue: null,
            queue: null,
            next: null
        };
        return Ye === null ? re.memoizedState = Ye = e : Ye = Ye.next = e,
        Ye
    }
    function qe() {
        if (je === null) {
            var e = re.alternate;
            e = e !== null ? e.memoizedState : null
        } else
            e = je.next;
        var t = Ye === null ? re.memoizedState : Ye.next;
        if (t !== null)
            Ye = t,
            je = e;
        else {
            if (e === null)
                throw re.alternate === null ? Error(u(467)) : Error(u(310));
            je = e,
            e = {
                memoizedState: je.memoizedState,
                baseState: je.baseState,
                baseQueue: je.baseQueue,
                queue: je.queue,
                next: null
            },
            Ye === null ? re.memoizedState = Ye = e : Ye = Ye.next = e
        }
        return Ye
    }
    function Di() {
        return {
            lastEffect: null,
            events: null,
            stores: null,
            memoCache: null
        }
    }
    function va(e) {
        var t = ya;
        return ya += 1,
        Nl === null && (Nl = []),
        e = ff(Nl, e, t),
        t = re,
        (Ye === null ? t.memoizedState : Ye.next) === null && (t = t.alternate,
        D.H = t === null || t.memoizedState === null ? nd : nu),
        e
    }
    function Ui(e) {
        if (e !== null && typeof e == "object") {
            if (typeof e.then == "function")
                return va(e);
            if (e.$$typeof === V)
                return We(e)
        }
        throw Error(u(438, String(e)))
    }
    function Xr(e) {
        var t = null
          , n = re.updateQueue;
        if (n !== null && (t = n.memoCache),
        t == null) {
            var l = re.alternate;
            l !== null && (l = l.updateQueue,
            l !== null && (l = l.memoCache,
            l != null && (t = {
                data: l.data.map(function(i) {
                    return i.slice()
                }),
                index: 0
            })))
        }
        if (t == null && (t = {
            data: [],
            index: 0
        }),
        n === null && (n = Di(),
        re.updateQueue = n),
        n.memoCache = t,
        n = t.data[t.index],
        n === void 0)
            for (n = t.data[t.index] = Array(e),
            l = 0; l < e; l++)
                n[l] = k;
        return t.index++,
        n
    }
    function It(e, t) {
        return typeof t == "function" ? t(e) : t
    }
    function Hi(e) {
        var t = qe();
        return Kr(t, je, e)
    }
    function Kr(e, t, n) {
        var l = e.queue;
        if (l === null)
            throw Error(u(311));
        l.lastRenderedReducer = n;
        var i = e.baseQueue
          , o = l.pending;
        if (o !== null) {
            if (i !== null) {
                var h = i.next;
                i.next = o.next,
                o.next = h
            }
            t.baseQueue = i = o,
            l.pending = null
        }
        if (o = e.baseState,
        i === null)
            e.memoizedState = o;
        else {
            t = i.next;
            var v = h = null
              , C = null
              , R = t
              , U = !1;
            do {
                var Y = R.lane & -536870913;
                if (Y !== R.lane ? (ge & Y) === Y : (Wt & Y) === Y) {
                    var M = R.revertLane;
                    if (M === 0)
                        C !== null && (C = C.next = {
                            lane: 0,
                            revertLane: 0,
                            gesture: null,
                            action: R.action,
                            hasEagerState: R.hasEagerState,
                            eagerState: R.eagerState,
                            next: null
                        }),
                        Y === bl && (U = !0);
                    else if ((Wt & M) === M) {
                        R = R.next,
                        M === bl && (U = !0);
                        continue
                    } else
                        Y = {
                            lane: 0,
                            revertLane: R.revertLane,
                            gesture: null,
                            action: R.action,
                            hasEagerState: R.hasEagerState,
                            eagerState: R.eagerState,
                            next: null
                        },
                        C === null ? (v = C = Y,
                        h = o) : C = C.next = Y,
                        re.lanes |= M,
                        Nn |= M;
                    Y = R.action,
                    In && n(o, Y),
                    o = R.hasEagerState ? R.eagerState : n(o, Y)
                } else
                    M = {
                        lane: Y,
                        revertLane: R.revertLane,
                        gesture: R.gesture,
                        action: R.action,
                        hasEagerState: R.hasEagerState,
                        eagerState: R.eagerState,
                        next: null
                    },
                    C === null ? (v = C = M,
                    h = o) : C = C.next = M,
                    re.lanes |= Y,
                    Nn |= Y;
                R = R.next
            } while (R !== null && R !== t);
            if (C === null ? h = o : C.next = v,
            !mt(o, e.memoizedState) && (Ve = !0,
            U && (n = Sl,
            n !== null)))
                throw n;
            e.memoizedState = o,
            e.baseState = h,
            e.baseQueue = C,
            l.lastRenderedState = o
        }
        return i === null && (l.lanes = 0),
        [e.memoizedState, l.dispatch]
    }
    function Zr(e) {
        var t = qe()
          , n = t.queue;
        if (n === null)
            throw Error(u(311));
        n.lastRenderedReducer = e;
        var l = n.dispatch
          , i = n.pending
          , o = t.memoizedState;
        if (i !== null) {
            n.pending = null;
            var h = i = i.next;
            do
                o = e(o, h.action),
                h = h.next;
            while (h !== i);
            mt(o, t.memoizedState) || (Ve = !0),
            t.memoizedState = o,
            t.baseQueue === null && (t.baseState = o),
            n.lastRenderedState = o
        }
        return [o, l]
    }
    function Ef(e, t, n) {
        var l = re
          , i = qe()
          , o = ve;
        if (o) {
            if (n === void 0)
                throw Error(u(407));
            n = n()
        } else
            n = t();
        var h = !mt((je || i).memoizedState, n);
        if (h && (i.memoizedState = n,
        Ve = !0),
        i = i.queue,
        Fr(Cf.bind(null, l, i, e), [e]),
        i.getSnapshot !== t || h || Ye !== null && Ye.memoizedState.tag & 1) {
            if (l.flags |= 2048,
            Tl(9, {
                destroy: void 0
            }, _f.bind(null, l, i, n, t), null),
            Re === null)
                throw Error(u(349));
            o || (Wt & 127) !== 0 || wf(l, t, n)
        }
        return n
    }
    function wf(e, t, n) {
        e.flags |= 16384,
        e = {
            getSnapshot: t,
            value: n
        },
        t = re.updateQueue,
        t === null ? (t = Di(),
        re.updateQueue = t,
        t.stores = [e]) : (n = t.stores,
        n === null ? t.stores = [e] : n.push(e))
    }
    function _f(e, t, n, l) {
        t.value = n,
        t.getSnapshot = l,
        Nf(t) && Tf(e)
    }
    function Cf(e, t, n) {
        return n(function() {
            Nf(t) && Tf(e)
        })
    }
    function Nf(e) {
        var t = e.getSnapshot;
        e = e.value;
        try {
            var n = t();
            return !mt(e, n)
        } catch {
            return !0
        }
    }
    function Tf(e) {
        var t = kn(e, 2);
        t !== null && ct(t, e, 2)
    }
    function Jr(e) {
        var t = lt();
        if (typeof e == "function") {
            var n = e;
            if (e = n(),
            In) {
                dn(!0);
                try {
                    n()
                } finally {
                    dn(!1)
                }
            }
        }
        return t.memoizedState = t.baseState = e,
        t.queue = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: It,
            lastRenderedState: e
        },
        t
    }
    function jf(e, t, n, l) {
        return e.baseState = n,
        Kr(e, je, typeof l == "function" ? l : It)
    }
    function T0(e, t, n, l, i) {
        if (Gi(e))
            throw Error(u(485));
        if (e = t.action,
        e !== null) {
            var o = {
                payload: i,
                action: e,
                next: null,
                isTransition: !0,
                status: "pending",
                value: null,
                reason: null,
                listeners: [],
                then: function(h) {
                    o.listeners.push(h)
                }
            };
            D.T !== null ? n(!0) : o.isTransition = !1,
            l(o),
            n = t.pending,
            n === null ? (o.next = t.pending = o,
            Of(t, o)) : (o.next = n.next,
            t.pending = n.next = o)
        }
    }
    function Of(e, t) {
        var n = t.action
          , l = t.payload
          , i = e.state;
        if (t.isTransition) {
            var o = D.T
              , h = {};
            D.T = h;
            try {
                var v = n(i, l)
                  , C = D.S;
                C !== null && C(h, v),
                Af(e, t, v)
            } catch (R) {
                $r(e, t, R)
            } finally {
                o !== null && h.types !== null && (o.types = h.types),
                D.T = o
            }
        } else
            try {
                o = n(i, l),
                Af(e, t, o)
            } catch (R) {
                $r(e, t, R)
            }
    }
    function Af(e, t, n) {
        n !== null && typeof n == "object" && typeof n.then == "function" ? n.then(function(l) {
            Rf(e, t, l)
        }, function(l) {
            return $r(e, t, l)
        }) : Rf(e, t, n)
    }
    function Rf(e, t, n) {
        t.status = "fulfilled",
        t.value = n,
        Mf(t),
        e.state = n,
        t = e.pending,
        t !== null && (n = t.next,
        n === t ? e.pending = null : (n = n.next,
        t.next = n,
        Of(e, n)))
    }
    function $r(e, t, n) {
        var l = e.pending;
        if (e.pending = null,
        l !== null) {
            l = l.next;
            do
                t.status = "rejected",
                t.reason = n,
                Mf(t),
                t = t.next;
            while (t !== l)
        }
        e.action = null
    }
    function Mf(e) {
        e = e.listeners;
        for (var t = 0; t < e.length; t++)
            (0,
            e[t])()
    }
    function Lf(e, t) {
        return t
    }
    function zf(e, t) {
        if (ve) {
            var n = Re.formState;
            if (n !== null) {
                e: {
                    var l = re;
                    if (ve) {
                        if (Me) {
                            t: {
                                for (var i = Me, o = Tt; i.nodeType !== 8; ) {
                                    if (!o) {
                                        i = null;
                                        break t
                                    }
                                    if (i = Ot(i.nextSibling),
                                    i === null) {
                                        i = null;
                                        break t
                                    }
                                }
                                o = i.data,
                                i = o === "F!" || o === "F" ? i : null
                            }
                            if (i) {
                                Me = Ot(i.nextSibling),
                                l = i.data === "F!";
                                break e
                            }
                        }
                        yn(l)
                    }
                    l = !1
                }
                l && (t = n[0])
            }
        }
        return n = lt(),
        n.memoizedState = n.baseState = t,
        l = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: Lf,
            lastRenderedState: t
        },
        n.queue = l,
        n = Pf.bind(null, re, l),
        l.dispatch = n,
        l = Jr(!1),
        o = tu.bind(null, re, !1, l.queue),
        l = lt(),
        i = {
            state: t,
            dispatch: null,
            action: e,
            pending: null
        },
        l.queue = i,
        n = T0.bind(null, re, i, o, n),
        i.dispatch = n,
        l.memoizedState = e,
        [t, n, !1]
    }
    function Df(e) {
        var t = qe();
        return Uf(t, je, e)
    }
    function Uf(e, t, n) {
        if (t = Kr(e, t, Lf)[0],
        e = Hi(It)[0],
        typeof t == "object" && t !== null && typeof t.then == "function")
            try {
                var l = va(t)
            } catch (h) {
                throw h === El ? Ti : h
            }
        else
            l = t;
        t = qe();
        var i = t.queue
          , o = i.dispatch;
        return n !== t.memoizedState && (re.flags |= 2048,
        Tl(9, {
            destroy: void 0
        }, j0.bind(null, i, n), null)),
        [l, o, e]
    }
    function j0(e, t) {
        e.action = t
    }
    function Hf(e) {
        var t = qe()
          , n = je;
        if (n !== null)
            return Uf(t, n, e);
        qe(),
        t = t.memoizedState,
        n = qe();
        var l = n.queue.dispatch;
        return n.memoizedState = e,
        [t, l, !1]
    }
    function Tl(e, t, n, l) {
        return e = {
            tag: e,
            create: n,
            deps: l,
            inst: t,
            next: null
        },
        t = re.updateQueue,
        t === null && (t = Di(),
        re.updateQueue = t),
        n = t.lastEffect,
        n === null ? t.lastEffect = e.next = e : (l = n.next,
        n.next = e,
        e.next = l,
        t.lastEffect = e),
        e
    }
    function Bf() {
        return qe().memoizedState
    }
    function Bi(e, t, n, l) {
        var i = lt();
        re.flags |= e,
        i.memoizedState = Tl(1 | t, {
            destroy: void 0
        }, n, l === void 0 ? null : l)
    }
    function qi(e, t, n, l) {
        var i = qe();
        l = l === void 0 ? null : l;
        var o = i.memoizedState.inst;
        je !== null && l !== null && Gr(l, je.memoizedState.deps) ? i.memoizedState = Tl(t, o, n, l) : (re.flags |= e,
        i.memoizedState = Tl(1 | t, o, n, l))
    }
    function qf(e, t) {
        Bi(8390656, 8, e, t)
    }
    function Fr(e, t) {
        qi(2048, 8, e, t)
    }
    function O0(e) {
        re.flags |= 4;
        var t = re.updateQueue;
        if (t === null)
            t = Di(),
            re.updateQueue = t,
            t.events = [e];
        else {
            var n = t.events;
            n === null ? t.events = [e] : n.push(e)
        }
    }
    function Gf(e) {
        var t = qe().memoizedState;
        return O0({
            ref: t,
            nextImpl: e
        }),
        function() {
            if ((Ee & 2) !== 0)
                throw Error(u(440));
            return t.impl.apply(void 0, arguments)
        }
    }
    function Yf(e, t) {
        return qi(4, 2, e, t)
    }
    function Vf(e, t) {
        return qi(4, 4, e, t)
    }
    function kf(e, t) {
        if (typeof t == "function") {
            e = e();
            var n = t(e);
            return function() {
                typeof n == "function" ? n() : t(null)
            }
        }
        if (t != null)
            return e = e(),
            t.current = e,
            function() {
                t.current = null
            }
    }
    function Qf(e, t, n) {
        n = n != null ? n.concat([e]) : null,
        qi(4, 4, kf.bind(null, t, e), n)
    }
    function Wr() {}
    function Xf(e, t) {
        var n = qe();
        t = t === void 0 ? null : t;
        var l = n.memoizedState;
        return t !== null && Gr(t, l[1]) ? l[0] : (n.memoizedState = [e, t],
        e)
    }
    function Kf(e, t) {
        var n = qe();
        t = t === void 0 ? null : t;
        var l = n.memoizedState;
        if (t !== null && Gr(t, l[1]))
            return l[0];
        if (l = e(),
        In) {
            dn(!0);
            try {
                e()
            } finally {
                dn(!1)
            }
        }
        return n.memoizedState = [l, t],
        l
    }
    function Ir(e, t, n) {
        return n === void 0 || (Wt & 1073741824) !== 0 && (ge & 261930) === 0 ? e.memoizedState = t : (e.memoizedState = n,
        e = Zd(),
        re.lanes |= e,
        Nn |= e,
        n)
    }
    function Zf(e, t, n, l) {
        return mt(n, t) ? n : _l.current !== null ? (e = Ir(e, n, l),
        mt(e, t) || (Ve = !0),
        e) : (Wt & 42) === 0 || (Wt & 1073741824) !== 0 && (ge & 261930) === 0 ? (Ve = !0,
        e.memoizedState = n) : (e = Zd(),
        re.lanes |= e,
        Nn |= e,
        t)
    }
    function Jf(e, t, n, l, i) {
        var o = Q.p;
        Q.p = o !== 0 && 8 > o ? o : 8;
        var h = D.T
          , v = {};
        D.T = v,
        tu(e, !1, t, n);
        try {
            var C = i()
              , R = D.S;
            if (R !== null && R(v, C),
            C !== null && typeof C == "object" && typeof C.then == "function") {
                var U = _0(C, l);
                xa(e, t, U, bt(e))
            } else
                xa(e, t, l, bt(e))
        } catch (Y) {
            xa(e, t, {
                then: function() {},
                status: "rejected",
                reason: Y
            }, bt())
        } finally {
            Q.p = o,
            h !== null && v.types !== null && (h.types = v.types),
            D.T = h
        }
    }
    function A0() {}
    function Pr(e, t, n, l) {
        if (e.tag !== 5)
            throw Error(u(476));
        var i = $f(e).queue;
        Jf(e, i, t, te, n === null ? A0 : function() {
            return Ff(e),
            n(l)
        }
        )
    }
    function $f(e) {
        var t = e.memoizedState;
        if (t !== null)
            return t;
        t = {
            memoizedState: te,
            baseState: te,
            baseQueue: null,
            queue: {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: It,
                lastRenderedState: te
            },
            next: null
        };
        var n = {};
        return t.next = {
            memoizedState: n,
            baseState: n,
            baseQueue: null,
            queue: {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: It,
                lastRenderedState: n
            },
            next: null
        },
        e.memoizedState = t,
        e = e.alternate,
        e !== null && (e.memoizedState = t),
        t
    }
    function Ff(e) {
        var t = $f(e);
        t.next === null && (t = e.alternate.memoizedState),
        xa(e, t.next.queue, {}, bt())
    }
    function eu() {
        return We(Ua)
    }
    function Wf() {
        return qe().memoizedState
    }
    function If() {
        return qe().memoizedState
    }
    function R0(e) {
        for (var t = e.return; t !== null; ) {
            switch (t.tag) {
            case 24:
            case 3:
                var n = bt();
                e = bn(n);
                var l = Sn(t, e, n);
                l !== null && (ct(l, t, n),
                ma(l, t, n)),
                t = {
                    cache: Or()
                },
                e.payload = t;
                return
            }
            t = t.return
        }
    }
    function M0(e, t, n) {
        var l = bt();
        n = {
            lane: l,
            revertLane: 0,
            gesture: null,
            action: n,
            hasEagerState: !1,
            eagerState: null,
            next: null
        },
        Gi(e) ? ed(t, n) : (n = vr(e, t, n, l),
        n !== null && (ct(n, e, l),
        td(n, t, l)))
    }
    function Pf(e, t, n) {
        var l = bt();
        xa(e, t, n, l)
    }
    function xa(e, t, n, l) {
        var i = {
            lane: l,
            revertLane: 0,
            gesture: null,
            action: n,
            hasEagerState: !1,
            eagerState: null,
            next: null
        };
        if (Gi(e))
            ed(t, i);
        else {
            var o = e.alternate;
            if (e.lanes === 0 && (o === null || o.lanes === 0) && (o = t.lastRenderedReducer,
            o !== null))
                try {
                    var h = t.lastRenderedState
                      , v = o(h, n);
                    if (i.hasEagerState = !0,
                    i.eagerState = v,
                    mt(v, h))
                        return bi(e, t, i, 0),
                        Re === null && xi(),
                        !1
                } catch {}
            if (n = vr(e, t, i, l),
            n !== null)
                return ct(n, e, l),
                td(n, t, l),
                !0
        }
        return !1
    }
    function tu(e, t, n, l) {
        if (l = {
            lane: 2,
            revertLane: Lu(),
            gesture: null,
            action: l,
            hasEagerState: !1,
            eagerState: null,
            next: null
        },
        Gi(e)) {
            if (t)
                throw Error(u(479))
        } else
            t = vr(e, n, l, 2),
            t !== null && ct(t, e, 2)
    }
    function Gi(e) {
        var t = e.alternate;
        return e === re || t !== null && t === re
    }
    function ed(e, t) {
        Cl = Li = !0;
        var n = e.pending;
        n === null ? t.next = t : (t.next = n.next,
        n.next = t),
        e.pending = t
    }
    function td(e, t, n) {
        if ((n & 4194048) !== 0) {
            var l = t.lanes;
            l &= e.pendingLanes,
            n |= l,
            t.lanes = n,
            ic(e, n)
        }
    }
    var ba = {
        readContext: We,
        use: Ui,
        useCallback: De,
        useContext: De,
        useEffect: De,
        useImperativeHandle: De,
        useLayoutEffect: De,
        useInsertionEffect: De,
        useMemo: De,
        useReducer: De,
        useRef: De,
        useState: De,
        useDebugValue: De,
        useDeferredValue: De,
        useTransition: De,
        useSyncExternalStore: De,
        useId: De,
        useHostTransitionStatus: De,
        useFormState: De,
        useActionState: De,
        useOptimistic: De,
        useMemoCache: De,
        useCacheRefresh: De
    };
    ba.useEffectEvent = De;
    var nd = {
        readContext: We,
        use: Ui,
        useCallback: function(e, t) {
            return lt().memoizedState = [e, t === void 0 ? null : t],
            e
        },
        useContext: We,
        useEffect: qf,
        useImperativeHandle: function(e, t, n) {
            n = n != null ? n.concat([e]) : null,
            Bi(4194308, 4, kf.bind(null, t, e), n)
        },
        useLayoutEffect: function(e, t) {
            return Bi(4194308, 4, e, t)
        },
        useInsertionEffect: function(e, t) {
            Bi(4, 2, e, t)
        },
        useMemo: function(e, t) {
            var n = lt();
            t = t === void 0 ? null : t;
            var l = e();
            if (In) {
                dn(!0);
                try {
                    e()
                } finally {
                    dn(!1)
                }
            }
            return n.memoizedState = [l, t],
            l
        },
        useReducer: function(e, t, n) {
            var l = lt();
            if (n !== void 0) {
                var i = n(t);
                if (In) {
                    dn(!0);
                    try {
                        n(t)
                    } finally {
                        dn(!1)
                    }
                }
            } else
                i = t;
            return l.memoizedState = l.baseState = i,
            e = {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: e,
                lastRenderedState: i
            },
            l.queue = e,
            e = e.dispatch = M0.bind(null, re, e),
            [l.memoizedState, e]
        },
        useRef: function(e) {
            var t = lt();
            return e = {
                current: e
            },
            t.memoizedState = e
        },
        useState: function(e) {
            e = Jr(e);
            var t = e.queue
              , n = Pf.bind(null, re, t);
            return t.dispatch = n,
            [e.memoizedState, n]
        },
        useDebugValue: Wr,
        useDeferredValue: function(e, t) {
            var n = lt();
            return Ir(n, e, t)
        },
        useTransition: function() {
            var e = Jr(!1);
            return e = Jf.bind(null, re, e.queue, !0, !1),
            lt().memoizedState = e,
            [!1, e]
        },
        useSyncExternalStore: function(e, t, n) {
            var l = re
              , i = lt();
            if (ve) {
                if (n === void 0)
                    throw Error(u(407));
                n = n()
            } else {
                if (n = t(),
                Re === null)
                    throw Error(u(349));
                (ge & 127) !== 0 || wf(l, t, n)
            }
            i.memoizedState = n;
            var o = {
                value: n,
                getSnapshot: t
            };
            return i.queue = o,
            qf(Cf.bind(null, l, o, e), [e]),
            l.flags |= 2048,
            Tl(9, {
                destroy: void 0
            }, _f.bind(null, l, o, n, t), null),
            n
        },
        useId: function() {
            var e = lt()
              , t = Re.identifierPrefix;
            if (ve) {
                var n = Ht
                  , l = Ut;
                n = (l & ~(1 << 32 - ht(l) - 1)).toString(32) + n,
                t = "_" + t + "R_" + n,
                n = zi++,
                0 < n && (t += "H" + n.toString(32)),
                t += "_"
            } else
                n = C0++,
                t = "_" + t + "r_" + n.toString(32) + "_";
            return e.memoizedState = t
        },
        useHostTransitionStatus: eu,
        useFormState: zf,
        useActionState: zf,
        useOptimistic: function(e) {
            var t = lt();
            t.memoizedState = t.baseState = e;
            var n = {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: null,
                lastRenderedState: null
            };
            return t.queue = n,
            t = tu.bind(null, re, !0, n),
            n.dispatch = t,
            [e, t]
        },
        useMemoCache: Xr,
        useCacheRefresh: function() {
            return lt().memoizedState = R0.bind(null, re)
        },
        useEffectEvent: function(e) {
            var t = lt()
              , n = {
                impl: e
            };
            return t.memoizedState = n,
            function() {
                if ((Ee & 2) !== 0)
                    throw Error(u(440));
                return n.impl.apply(void 0, arguments)
            }
        }
    }
      , nu = {
        readContext: We,
        use: Ui,
        useCallback: Xf,
        useContext: We,
        useEffect: Fr,
        useImperativeHandle: Qf,
        useInsertionEffect: Yf,
        useLayoutEffect: Vf,
        useMemo: Kf,
        useReducer: Hi,
        useRef: Bf,
        useState: function() {
            return Hi(It)
        },
        useDebugValue: Wr,
        useDeferredValue: function(e, t) {
            var n = qe();
            return Zf(n, je.memoizedState, e, t)
        },
        useTransition: function() {
            var e = Hi(It)[0]
              , t = qe().memoizedState;
            return [typeof e == "boolean" ? e : va(e), t]
        },
        useSyncExternalStore: Ef,
        useId: Wf,
        useHostTransitionStatus: eu,
        useFormState: Df,
        useActionState: Df,
        useOptimistic: function(e, t) {
            var n = qe();
            return jf(n, je, e, t)
        },
        useMemoCache: Xr,
        useCacheRefresh: If
    };
    nu.useEffectEvent = Gf;
    var ld = {
        readContext: We,
        use: Ui,
        useCallback: Xf,
        useContext: We,
        useEffect: Fr,
        useImperativeHandle: Qf,
        useInsertionEffect: Yf,
        useLayoutEffect: Vf,
        useMemo: Kf,
        useReducer: Zr,
        useRef: Bf,
        useState: function() {
            return Zr(It)
        },
        useDebugValue: Wr,
        useDeferredValue: function(e, t) {
            var n = qe();
            return je === null ? Ir(n, e, t) : Zf(n, je.memoizedState, e, t)
        },
        useTransition: function() {
            var e = Zr(It)[0]
              , t = qe().memoizedState;
            return [typeof e == "boolean" ? e : va(e), t]
        },
        useSyncExternalStore: Ef,
        useId: Wf,
        useHostTransitionStatus: eu,
        useFormState: Hf,
        useActionState: Hf,
        useOptimistic: function(e, t) {
            var n = qe();
            return je !== null ? jf(n, je, e, t) : (n.baseState = e,
            [e, n.queue.dispatch])
        },
        useMemoCache: Xr,
        useCacheRefresh: If
    };
    ld.useEffectEvent = Gf;
    function lu(e, t, n, l) {
        t = e.memoizedState,
        n = n(l, t),
        n = n == null ? t : x({}, t, n),
        e.memoizedState = n,
        e.lanes === 0 && (e.updateQueue.baseState = n)
    }
    var au = {
        enqueueSetState: function(e, t, n) {
            e = e._reactInternals;
            var l = bt()
              , i = bn(l);
            i.payload = t,
            n != null && (i.callback = n),
            t = Sn(e, i, l),
            t !== null && (ct(t, e, l),
            ma(t, e, l))
        },
        enqueueReplaceState: function(e, t, n) {
            e = e._reactInternals;
            var l = bt()
              , i = bn(l);
            i.tag = 1,
            i.payload = t,
            n != null && (i.callback = n),
            t = Sn(e, i, l),
            t !== null && (ct(t, e, l),
            ma(t, e, l))
        },
        enqueueForceUpdate: function(e, t) {
            e = e._reactInternals;
            var n = bt()
              , l = bn(n);
            l.tag = 2,
            t != null && (l.callback = t),
            t = Sn(e, l, n),
            t !== null && (ct(t, e, n),
            ma(t, e, n))
        }
    };
    function ad(e, t, n, l, i, o, h) {
        return e = e.stateNode,
        typeof e.shouldComponentUpdate == "function" ? e.shouldComponentUpdate(l, o, h) : t.prototype && t.prototype.isPureReactComponent ? !sa(n, l) || !sa(i, o) : !0
    }
    function id(e, t, n, l) {
        e = t.state,
        typeof t.componentWillReceiveProps == "function" && t.componentWillReceiveProps(n, l),
        typeof t.UNSAFE_componentWillReceiveProps == "function" && t.UNSAFE_componentWillReceiveProps(n, l),
        t.state !== e && au.enqueueReplaceState(t, t.state, null)
    }
    function Pn(e, t) {
        var n = t;
        if ("ref"in t) {
            n = {};
            for (var l in t)
                l !== "ref" && (n[l] = t[l])
        }
        if (e = e.defaultProps) {
            n === t && (n = x({}, n));
            for (var i in e)
                n[i] === void 0 && (n[i] = e[i])
        }
        return n
    }
    function sd(e) {
        vi(e)
    }
    function rd(e) {
        console.error(e)
    }
    function ud(e) {
        vi(e)
    }
    function Yi(e, t) {
        try {
            var n = e.onUncaughtError;
            n(t.value, {
                componentStack: t.stack
            })
        } catch (l) {
            setTimeout(function() {
                throw l
            })
        }
    }
    function od(e, t, n) {
        try {
            var l = e.onCaughtError;
            l(n.value, {
                componentStack: n.stack,
                errorBoundary: t.tag === 1 ? t.stateNode : null
            })
        } catch (i) {
            setTimeout(function() {
                throw i
            })
        }
    }
    function iu(e, t, n) {
        return n = bn(n),
        n.tag = 3,
        n.payload = {
            element: null
        },
        n.callback = function() {
            Yi(e, t)
        }
        ,
        n
    }
    function cd(e) {
        return e = bn(e),
        e.tag = 3,
        e
    }
    function fd(e, t, n, l) {
        var i = n.type.getDerivedStateFromError;
        if (typeof i == "function") {
            var o = l.value;
            e.payload = function() {
                return i(o)
            }
            ,
            e.callback = function() {
                od(t, n, l)
            }
        }
        var h = n.stateNode;
        h !== null && typeof h.componentDidCatch == "function" && (e.callback = function() {
            od(t, n, l),
            typeof i != "function" && (Tn === null ? Tn = new Set([this]) : Tn.add(this));
            var v = l.stack;
            this.componentDidCatch(l.value, {
                componentStack: v !== null ? v : ""
            })
        }
        )
    }
    function L0(e, t, n, l, i) {
        if (n.flags |= 32768,
        l !== null && typeof l == "object" && typeof l.then == "function") {
            if (t = n.alternate,
            t !== null && xl(t, n, i, !0),
            n = pt.current,
            n !== null) {
                switch (n.tag) {
                case 31:
                case 13:
                    return jt === null ? Pi() : n.alternate === null && Ue === 0 && (Ue = 3),
                    n.flags &= -257,
                    n.flags |= 65536,
                    n.lanes = i,
                    l === ji ? n.flags |= 16384 : (t = n.updateQueue,
                    t === null ? n.updateQueue = new Set([l]) : t.add(l),
                    Au(e, l, i)),
                    !1;
                case 22:
                    return n.flags |= 65536,
                    l === ji ? n.flags |= 16384 : (t = n.updateQueue,
                    t === null ? (t = {
                        transitions: null,
                        markerInstances: null,
                        retryQueue: new Set([l])
                    },
                    n.updateQueue = t) : (n = t.retryQueue,
                    n === null ? t.retryQueue = new Set([l]) : n.add(l)),
                    Au(e, l, i)),
                    !1
                }
                throw Error(u(435, n.tag))
            }
            return Au(e, l, i),
            Pi(),
            !1
        }
        if (ve)
            return t = pt.current,
            t !== null ? ((t.flags & 65536) === 0 && (t.flags |= 256),
            t.flags |= 65536,
            t.lanes = i,
            l !== _r && (e = Error(u(422), {
                cause: l
            }),
            oa(_t(e, n)))) : (l !== _r && (t = Error(u(423), {
                cause: l
            }),
            oa(_t(t, n))),
            e = e.current.alternate,
            e.flags |= 65536,
            i &= -i,
            e.lanes |= i,
            l = _t(l, n),
            i = iu(e.stateNode, l, i),
            Dr(e, i),
            Ue !== 4 && (Ue = 2)),
            !1;
        var o = Error(u(520), {
            cause: l
        });
        if (o = _t(o, n),
        ja === null ? ja = [o] : ja.push(o),
        Ue !== 4 && (Ue = 2),
        t === null)
            return !0;
        l = _t(l, n),
        n = t;
        do {
            switch (n.tag) {
            case 3:
                return n.flags |= 65536,
                e = i & -i,
                n.lanes |= e,
                e = iu(n.stateNode, l, e),
                Dr(n, e),
                !1;
            case 1:
                if (t = n.type,
                o = n.stateNode,
                (n.flags & 128) === 0 && (typeof t.getDerivedStateFromError == "function" || o !== null && typeof o.componentDidCatch == "function" && (Tn === null || !Tn.has(o))))
                    return n.flags |= 65536,
                    i &= -i,
                    n.lanes |= i,
                    i = cd(i),
                    fd(i, e, n, l),
                    Dr(n, i),
                    !1
            }
            n = n.return
        } while (n !== null);
        return !1
    }
    var su = Error(u(461))
      , Ve = !1;
    function Ie(e, t, n, l) {
        t.child = e === null ? gf(t, null, n, l) : Wn(t, e.child, n, l)
    }
    function dd(e, t, n, l, i) {
        n = n.render;
        var o = t.ref;
        if ("ref"in l) {
            var h = {};
            for (var v in l)
                v !== "ref" && (h[v] = l[v])
        } else
            h = l;
        return Zn(t),
        l = Yr(e, t, n, h, o, i),
        v = Vr(),
        e !== null && !Ve ? (kr(e, t, i),
        Pt(e, t, i)) : (ve && v && Er(t),
        t.flags |= 1,
        Ie(e, t, l, i),
        t.child)
    }
    function hd(e, t, n, l, i) {
        if (e === null) {
            var o = n.type;
            return typeof o == "function" && !xr(o) && o.defaultProps === void 0 && n.compare === null ? (t.tag = 15,
            t.type = o,
            md(e, t, o, l, i)) : (e = Ei(n.type, null, l, t, t.mode, i),
            e.ref = t.ref,
            e.return = t,
            t.child = e)
        }
        if (o = e.child,
        !mu(e, i)) {
            var h = o.memoizedProps;
            if (n = n.compare,
            n = n !== null ? n : sa,
            n(h, l) && e.ref === t.ref)
                return Pt(e, t, i)
        }
        return t.flags |= 1,
        e = Zt(o, l),
        e.ref = t.ref,
        e.return = t,
        t.child = e
    }
    function md(e, t, n, l, i) {
        if (e !== null) {
            var o = e.memoizedProps;
            if (sa(o, l) && e.ref === t.ref)
                if (Ve = !1,
                t.pendingProps = l = o,
                mu(e, i))
                    (e.flags & 131072) !== 0 && (Ve = !0);
                else
                    return t.lanes = e.lanes,
                    Pt(e, t, i)
        }
        return ru(e, t, n, l, i)
    }
    function gd(e, t, n, l) {
        var i = l.children
          , o = e !== null ? e.memoizedState : null;
        if (e === null && t.stateNode === null && (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null
        }),
        l.mode === "hidden") {
            if ((t.flags & 128) !== 0) {
                if (o = o !== null ? o.baseLanes | n : n,
                e !== null) {
                    for (l = t.child = e.child,
                    i = 0; l !== null; )
                        i = i | l.lanes | l.childLanes,
                        l = l.sibling;
                    l = i & ~o
                } else
                    l = 0,
                    t.child = null;
                return pd(e, t, o, n, l)
            }
            if ((n & 536870912) !== 0)
                t.memoizedState = {
                    baseLanes: 0,
                    cachePool: null
                },
                e !== null && Ni(t, o !== null ? o.cachePool : null),
                o !== null ? vf(t, o) : Hr(),
                xf(t);
            else
                return l = t.lanes = 536870912,
                pd(e, t, o !== null ? o.baseLanes | n : n, n, l)
        } else
            o !== null ? (Ni(t, o.cachePool),
            vf(t, o),
            wn(),
            t.memoizedState = null) : (e !== null && Ni(t, null),
            Hr(),
            wn());
        return Ie(e, t, i, n),
        t.child
    }
    function Sa(e, t) {
        return e !== null && e.tag === 22 || t.stateNode !== null || (t.stateNode = {
            _visibility: 1,
            _pendingMarkers: null,
            _retryCache: null,
            _transitions: null
        }),
        t.sibling
    }
    function pd(e, t, n, l, i) {
        var o = Rr();
        return o = o === null ? null : {
            parent: Ge._currentValue,
            pool: o
        },
        t.memoizedState = {
            baseLanes: n,
            cachePool: o
        },
        e !== null && Ni(t, null),
        Hr(),
        xf(t),
        e !== null && xl(e, t, l, !0),
        t.childLanes = i,
        null
    }
    function Vi(e, t) {
        return t = Qi({
            mode: t.mode,
            children: t.children
        }, e.mode),
        t.ref = e.ref,
        e.child = t,
        t.return = e,
        t
    }
    function yd(e, t, n) {
        return Wn(t, e.child, null, n),
        e = Vi(t, t.pendingProps),
        e.flags |= 2,
        yt(t),
        t.memoizedState = null,
        e
    }
    function z0(e, t, n) {
        var l = t.pendingProps
          , i = (t.flags & 128) !== 0;
        if (t.flags &= -129,
        e === null) {
            if (ve) {
                if (l.mode === "hidden")
                    return e = Vi(t, l),
                    t.lanes = 536870912,
                    Sa(null, e);
                if (qr(t),
                (e = Me) ? (e = Oh(e, Tt),
                e = e !== null && e.data === "&" ? e : null,
                e !== null && (t.memoizedState = {
                    dehydrated: e,
                    treeContext: gn !== null ? {
                        id: Ut,
                        overflow: Ht
                    } : null,
                    retryLane: 536870912,
                    hydrationErrors: null
                },
                n = Pc(e),
                n.return = t,
                t.child = n,
                Fe = t,
                Me = null)) : e = null,
                e === null)
                    throw yn(t);
                return t.lanes = 536870912,
                null
            }
            return Vi(t, l)
        }
        var o = e.memoizedState;
        if (o !== null) {
            var h = o.dehydrated;
            if (qr(t),
            i)
                if (t.flags & 256)
                    t.flags &= -257,
                    t = yd(e, t, n);
                else if (t.memoizedState !== null)
                    t.child = e.child,
                    t.flags |= 128,
                    t = null;
                else
                    throw Error(u(558));
            else if (Ve || xl(e, t, n, !1),
            i = (n & e.childLanes) !== 0,
            Ve || i) {
                if (l = Re,
                l !== null && (h = sc(l, n),
                h !== 0 && h !== o.retryLane))
                    throw o.retryLane = h,
                    kn(e, h),
                    ct(l, e, h),
                    su;
                Pi(),
                t = yd(e, t, n)
            } else
                e = o.treeContext,
                Me = Ot(h.nextSibling),
                Fe = t,
                ve = !0,
                pn = null,
                Tt = !1,
                e !== null && nf(t, e),
                t = Vi(t, l),
                t.flags |= 4096;
            return t
        }
        return e = Zt(e.child, {
            mode: l.mode,
            children: l.children
        }),
        e.ref = t.ref,
        t.child = e,
        e.return = t,
        e
    }
    function ki(e, t) {
        var n = t.ref;
        if (n === null)
            e !== null && e.ref !== null && (t.flags |= 4194816);
        else {
            if (typeof n != "function" && typeof n != "object")
                throw Error(u(284));
            (e === null || e.ref !== n) && (t.flags |= 4194816)
        }
    }
    function ru(e, t, n, l, i) {
        return Zn(t),
        n = Yr(e, t, n, l, void 0, i),
        l = Vr(),
        e !== null && !Ve ? (kr(e, t, i),
        Pt(e, t, i)) : (ve && l && Er(t),
        t.flags |= 1,
        Ie(e, t, n, i),
        t.child)
    }
    function vd(e, t, n, l, i, o) {
        return Zn(t),
        t.updateQueue = null,
        n = Sf(t, l, n, i),
        bf(e),
        l = Vr(),
        e !== null && !Ve ? (kr(e, t, o),
        Pt(e, t, o)) : (ve && l && Er(t),
        t.flags |= 1,
        Ie(e, t, n, o),
        t.child)
    }
    function xd(e, t, n, l, i) {
        if (Zn(t),
        t.stateNode === null) {
            var o = gl
              , h = n.contextType;
            typeof h == "object" && h !== null && (o = We(h)),
            o = new n(l,o),
            t.memoizedState = o.state !== null && o.state !== void 0 ? o.state : null,
            o.updater = au,
            t.stateNode = o,
            o._reactInternals = t,
            o = t.stateNode,
            o.props = l,
            o.state = t.memoizedState,
            o.refs = {},
            Lr(t),
            h = n.contextType,
            o.context = typeof h == "object" && h !== null ? We(h) : gl,
            o.state = t.memoizedState,
            h = n.getDerivedStateFromProps,
            typeof h == "function" && (lu(t, n, h, l),
            o.state = t.memoizedState),
            typeof n.getDerivedStateFromProps == "function" || typeof o.getSnapshotBeforeUpdate == "function" || typeof o.UNSAFE_componentWillMount != "function" && typeof o.componentWillMount != "function" || (h = o.state,
            typeof o.componentWillMount == "function" && o.componentWillMount(),
            typeof o.UNSAFE_componentWillMount == "function" && o.UNSAFE_componentWillMount(),
            h !== o.state && au.enqueueReplaceState(o, o.state, null),
            pa(t, l, o, i),
            ga(),
            o.state = t.memoizedState),
            typeof o.componentDidMount == "function" && (t.flags |= 4194308),
            l = !0
        } else if (e === null) {
            o = t.stateNode;
            var v = t.memoizedProps
              , C = Pn(n, v);
            o.props = C;
            var R = o.context
              , U = n.contextType;
            h = gl,
            typeof U == "object" && U !== null && (h = We(U));
            var Y = n.getDerivedStateFromProps;
            U = typeof Y == "function" || typeof o.getSnapshotBeforeUpdate == "function",
            v = t.pendingProps !== v,
            U || typeof o.UNSAFE_componentWillReceiveProps != "function" && typeof o.componentWillReceiveProps != "function" || (v || R !== h) && id(t, o, l, h),
            xn = !1;
            var M = t.memoizedState;
            o.state = M,
            pa(t, l, o, i),
            ga(),
            R = t.memoizedState,
            v || M !== R || xn ? (typeof Y == "function" && (lu(t, n, Y, l),
            R = t.memoizedState),
            (C = xn || ad(t, n, C, l, M, R, h)) ? (U || typeof o.UNSAFE_componentWillMount != "function" && typeof o.componentWillMount != "function" || (typeof o.componentWillMount == "function" && o.componentWillMount(),
            typeof o.UNSAFE_componentWillMount == "function" && o.UNSAFE_componentWillMount()),
            typeof o.componentDidMount == "function" && (t.flags |= 4194308)) : (typeof o.componentDidMount == "function" && (t.flags |= 4194308),
            t.memoizedProps = l,
            t.memoizedState = R),
            o.props = l,
            o.state = R,
            o.context = h,
            l = C) : (typeof o.componentDidMount == "function" && (t.flags |= 4194308),
            l = !1)
        } else {
            o = t.stateNode,
            zr(e, t),
            h = t.memoizedProps,
            U = Pn(n, h),
            o.props = U,
            Y = t.pendingProps,
            M = o.context,
            R = n.contextType,
            C = gl,
            typeof R == "object" && R !== null && (C = We(R)),
            v = n.getDerivedStateFromProps,
            (R = typeof v == "function" || typeof o.getSnapshotBeforeUpdate == "function") || typeof o.UNSAFE_componentWillReceiveProps != "function" && typeof o.componentWillReceiveProps != "function" || (h !== Y || M !== C) && id(t, o, l, C),
            xn = !1,
            M = t.memoizedState,
            o.state = M,
            pa(t, l, o, i),
            ga();
            var z = t.memoizedState;
            h !== Y || M !== z || xn || e !== null && e.dependencies !== null && _i(e.dependencies) ? (typeof v == "function" && (lu(t, n, v, l),
            z = t.memoizedState),
            (U = xn || ad(t, n, U, l, M, z, C) || e !== null && e.dependencies !== null && _i(e.dependencies)) ? (R || typeof o.UNSAFE_componentWillUpdate != "function" && typeof o.componentWillUpdate != "function" || (typeof o.componentWillUpdate == "function" && o.componentWillUpdate(l, z, C),
            typeof o.UNSAFE_componentWillUpdate == "function" && o.UNSAFE_componentWillUpdate(l, z, C)),
            typeof o.componentDidUpdate == "function" && (t.flags |= 4),
            typeof o.getSnapshotBeforeUpdate == "function" && (t.flags |= 1024)) : (typeof o.componentDidUpdate != "function" || h === e.memoizedProps && M === e.memoizedState || (t.flags |= 4),
            typeof o.getSnapshotBeforeUpdate != "function" || h === e.memoizedProps && M === e.memoizedState || (t.flags |= 1024),
            t.memoizedProps = l,
            t.memoizedState = z),
            o.props = l,
            o.state = z,
            o.context = C,
            l = U) : (typeof o.componentDidUpdate != "function" || h === e.memoizedProps && M === e.memoizedState || (t.flags |= 4),
            typeof o.getSnapshotBeforeUpdate != "function" || h === e.memoizedProps && M === e.memoizedState || (t.flags |= 1024),
            l = !1)
        }
        return o = l,
        ki(e, t),
        l = (t.flags & 128) !== 0,
        o || l ? (o = t.stateNode,
        n = l && typeof n.getDerivedStateFromError != "function" ? null : o.render(),
        t.flags |= 1,
        e !== null && l ? (t.child = Wn(t, e.child, null, i),
        t.child = Wn(t, null, n, i)) : Ie(e, t, n, i),
        t.memoizedState = o.state,
        e = t.child) : e = Pt(e, t, i),
        e
    }
    function bd(e, t, n, l) {
        return Xn(),
        t.flags |= 256,
        Ie(e, t, n, l),
        t.child
    }
    var uu = {
        dehydrated: null,
        treeContext: null,
        retryLane: 0,
        hydrationErrors: null
    };
    function ou(e) {
        return {
            baseLanes: e,
            cachePool: of()
        }
    }
    function cu(e, t, n) {
        return e = e !== null ? e.childLanes & ~n : 0,
        t && (e |= xt),
        e
    }
    function Sd(e, t, n) {
        var l = t.pendingProps, i = !1, o = (t.flags & 128) !== 0, h;
        if ((h = o) || (h = e !== null && e.memoizedState === null ? !1 : (Be.current & 2) !== 0),
        h && (i = !0,
        t.flags &= -129),
        h = (t.flags & 32) !== 0,
        t.flags &= -33,
        e === null) {
            if (ve) {
                if (i ? En(t) : wn(),
                (e = Me) ? (e = Oh(e, Tt),
                e = e !== null && e.data !== "&" ? e : null,
                e !== null && (t.memoizedState = {
                    dehydrated: e,
                    treeContext: gn !== null ? {
                        id: Ut,
                        overflow: Ht
                    } : null,
                    retryLane: 536870912,
                    hydrationErrors: null
                },
                n = Pc(e),
                n.return = t,
                t.child = n,
                Fe = t,
                Me = null)) : e = null,
                e === null)
                    throw yn(t);
                return Ku(e) ? t.lanes = 32 : t.lanes = 536870912,
                null
            }
            var v = l.children;
            return l = l.fallback,
            i ? (wn(),
            i = t.mode,
            v = Qi({
                mode: "hidden",
                children: v
            }, i),
            l = Qn(l, i, n, null),
            v.return = t,
            l.return = t,
            v.sibling = l,
            t.child = v,
            l = t.child,
            l.memoizedState = ou(n),
            l.childLanes = cu(e, h, n),
            t.memoizedState = uu,
            Sa(null, l)) : (En(t),
            fu(t, v))
        }
        var C = e.memoizedState;
        if (C !== null && (v = C.dehydrated,
        v !== null)) {
            if (o)
                t.flags & 256 ? (En(t),
                t.flags &= -257,
                t = du(e, t, n)) : t.memoizedState !== null ? (wn(),
                t.child = e.child,
                t.flags |= 128,
                t = null) : (wn(),
                v = l.fallback,
                i = t.mode,
                l = Qi({
                    mode: "visible",
                    children: l.children
                }, i),
                v = Qn(v, i, n, null),
                v.flags |= 2,
                l.return = t,
                v.return = t,
                l.sibling = v,
                t.child = l,
                Wn(t, e.child, null, n),
                l = t.child,
                l.memoizedState = ou(n),
                l.childLanes = cu(e, h, n),
                t.memoizedState = uu,
                t = Sa(null, l));
            else if (En(t),
            Ku(v)) {
                if (h = v.nextSibling && v.nextSibling.dataset,
                h)
                    var R = h.dgst;
                h = R,
                l = Error(u(419)),
                l.stack = "",
                l.digest = h,
                oa({
                    value: l,
                    source: null,
                    stack: null
                }),
                t = du(e, t, n)
            } else if (Ve || xl(e, t, n, !1),
            h = (n & e.childLanes) !== 0,
            Ve || h) {
                if (h = Re,
                h !== null && (l = sc(h, n),
                l !== 0 && l !== C.retryLane))
                    throw C.retryLane = l,
                    kn(e, l),
                    ct(h, e, l),
                    su;
                Xu(v) || Pi(),
                t = du(e, t, n)
            } else
                Xu(v) ? (t.flags |= 192,
                t.child = e.child,
                t = null) : (e = C.treeContext,
                Me = Ot(v.nextSibling),
                Fe = t,
                ve = !0,
                pn = null,
                Tt = !1,
                e !== null && nf(t, e),
                t = fu(t, l.children),
                t.flags |= 4096);
            return t
        }
        return i ? (wn(),
        v = l.fallback,
        i = t.mode,
        C = e.child,
        R = C.sibling,
        l = Zt(C, {
            mode: "hidden",
            children: l.children
        }),
        l.subtreeFlags = C.subtreeFlags & 65011712,
        R !== null ? v = Zt(R, v) : (v = Qn(v, i, n, null),
        v.flags |= 2),
        v.return = t,
        l.return = t,
        l.sibling = v,
        t.child = l,
        Sa(null, l),
        l = t.child,
        v = e.child.memoizedState,
        v === null ? v = ou(n) : (i = v.cachePool,
        i !== null ? (C = Ge._currentValue,
        i = i.parent !== C ? {
            parent: C,
            pool: C
        } : i) : i = of(),
        v = {
            baseLanes: v.baseLanes | n,
            cachePool: i
        }),
        l.memoizedState = v,
        l.childLanes = cu(e, h, n),
        t.memoizedState = uu,
        Sa(e.child, l)) : (En(t),
        n = e.child,
        e = n.sibling,
        n = Zt(n, {
            mode: "visible",
            children: l.children
        }),
        n.return = t,
        n.sibling = null,
        e !== null && (h = t.deletions,
        h === null ? (t.deletions = [e],
        t.flags |= 16) : h.push(e)),
        t.child = n,
        t.memoizedState = null,
        n)
    }
    function fu(e, t) {
        return t = Qi({
            mode: "visible",
            children: t
        }, e.mode),
        t.return = e,
        e.child = t
    }
    function Qi(e, t) {
        return e = gt(22, e, null, t),
        e.lanes = 0,
        e
    }
    function du(e, t, n) {
        return Wn(t, e.child, null, n),
        e = fu(t, t.pendingProps.children),
        e.flags |= 2,
        t.memoizedState = null,
        e
    }
    function Ed(e, t, n) {
        e.lanes |= t;
        var l = e.alternate;
        l !== null && (l.lanes |= t),
        Tr(e.return, t, n)
    }
    function hu(e, t, n, l, i, o) {
        var h = e.memoizedState;
        h === null ? e.memoizedState = {
            isBackwards: t,
            rendering: null,
            renderingStartTime: 0,
            last: l,
            tail: n,
            tailMode: i,
            treeForkCount: o
        } : (h.isBackwards = t,
        h.rendering = null,
        h.renderingStartTime = 0,
        h.last = l,
        h.tail = n,
        h.tailMode = i,
        h.treeForkCount = o)
    }
    function wd(e, t, n) {
        var l = t.pendingProps
          , i = l.revealOrder
          , o = l.tail;
        l = l.children;
        var h = Be.current
          , v = (h & 2) !== 0;
        if (v ? (h = h & 1 | 2,
        t.flags |= 128) : h &= 1,
        K(Be, h),
        Ie(e, t, l, n),
        l = ve ? ua : 0,
        !v && e !== null && (e.flags & 128) !== 0)
            e: for (e = t.child; e !== null; ) {
                if (e.tag === 13)
                    e.memoizedState !== null && Ed(e, n, t);
                else if (e.tag === 19)
                    Ed(e, n, t);
                else if (e.child !== null) {
                    e.child.return = e,
                    e = e.child;
                    continue
                }
                if (e === t)
                    break e;
                for (; e.sibling === null; ) {
                    if (e.return === null || e.return === t)
                        break e;
                    e = e.return
                }
                e.sibling.return = e.return,
                e = e.sibling
            }
        switch (i) {
        case "forwards":
            for (n = t.child,
            i = null; n !== null; )
                e = n.alternate,
                e !== null && Mi(e) === null && (i = n),
                n = n.sibling;
            n = i,
            n === null ? (i = t.child,
            t.child = null) : (i = n.sibling,
            n.sibling = null),
            hu(t, !1, i, n, o, l);
            break;
        case "backwards":
        case "unstable_legacy-backwards":
            for (n = null,
            i = t.child,
            t.child = null; i !== null; ) {
                if (e = i.alternate,
                e !== null && Mi(e) === null) {
                    t.child = i;
                    break
                }
                e = i.sibling,
                i.sibling = n,
                n = i,
                i = e
            }
            hu(t, !0, n, null, o, l);
            break;
        case "together":
            hu(t, !1, null, null, void 0, l);
            break;
        default:
            t.memoizedState = null
        }
        return t.child
    }
    function Pt(e, t, n) {
        if (e !== null && (t.dependencies = e.dependencies),
        Nn |= t.lanes,
        (n & t.childLanes) === 0)
            if (e !== null) {
                if (xl(e, t, n, !1),
                (n & t.childLanes) === 0)
                    return null
            } else
                return null;
        if (e !== null && t.child !== e.child)
            throw Error(u(153));
        if (t.child !== null) {
            for (e = t.child,
            n = Zt(e, e.pendingProps),
            t.child = n,
            n.return = t; e.sibling !== null; )
                e = e.sibling,
                n = n.sibling = Zt(e, e.pendingProps),
                n.return = t;
            n.sibling = null
        }
        return t.child
    }
    function mu(e, t) {
        return (e.lanes & t) !== 0 ? !0 : (e = e.dependencies,
        !!(e !== null && _i(e)))
    }
    function D0(e, t, n) {
        switch (t.tag) {
        case 3:
            nt(t, t.stateNode.containerInfo),
            vn(t, Ge, e.memoizedState.cache),
            Xn();
            break;
        case 27:
        case 5:
            Zl(t);
            break;
        case 4:
            nt(t, t.stateNode.containerInfo);
            break;
        case 10:
            vn(t, t.type, t.memoizedProps.value);
            break;
        case 31:
            if (t.memoizedState !== null)
                return t.flags |= 128,
                qr(t),
                null;
            break;
        case 13:
            var l = t.memoizedState;
            if (l !== null)
                return l.dehydrated !== null ? (En(t),
                t.flags |= 128,
                null) : (n & t.child.childLanes) !== 0 ? Sd(e, t, n) : (En(t),
                e = Pt(e, t, n),
                e !== null ? e.sibling : null);
            En(t);
            break;
        case 19:
            var i = (e.flags & 128) !== 0;
            if (l = (n & t.childLanes) !== 0,
            l || (xl(e, t, n, !1),
            l = (n & t.childLanes) !== 0),
            i) {
                if (l)
                    return wd(e, t, n);
                t.flags |= 128
            }
            if (i = t.memoizedState,
            i !== null && (i.rendering = null,
            i.tail = null,
            i.lastEffect = null),
            K(Be, Be.current),
            l)
                break;
            return null;
        case 22:
            return t.lanes = 0,
            gd(e, t, n, t.pendingProps);
        case 24:
            vn(t, Ge, e.memoizedState.cache)
        }
        return Pt(e, t, n)
    }
    function _d(e, t, n) {
        if (e !== null)
            if (e.memoizedProps !== t.pendingProps)
                Ve = !0;
            else {
                if (!mu(e, n) && (t.flags & 128) === 0)
                    return Ve = !1,
                    D0(e, t, n);
                Ve = (e.flags & 131072) !== 0
            }
        else
            Ve = !1,
            ve && (t.flags & 1048576) !== 0 && tf(t, ua, t.index);
        switch (t.lanes = 0,
        t.tag) {
        case 16:
            e: {
                var l = t.pendingProps;
                if (e = $n(t.elementType),
                t.type = e,
                typeof e == "function")
                    xr(e) ? (l = Pn(e, l),
                    t.tag = 1,
                    t = xd(null, t, e, l, n)) : (t.tag = 0,
                    t = ru(null, t, e, l, n));
                else {
                    if (e != null) {
                        var i = e.$$typeof;
                        if (i === J) {
                            t.tag = 11,
                            t = dd(null, t, e, l, n);
                            break e
                        } else if (i === I) {
                            t.tag = 14,
                            t = hd(null, t, e, l, n);
                            break e
                        }
                    }
                    throw t = oe(e) || e,
                    Error(u(306, t, ""))
                }
            }
            return t;
        case 0:
            return ru(e, t, t.type, t.pendingProps, n);
        case 1:
            return l = t.type,
            i = Pn(l, t.pendingProps),
            xd(e, t, l, i, n);
        case 3:
            e: {
                if (nt(t, t.stateNode.containerInfo),
                e === null)
                    throw Error(u(387));
                l = t.pendingProps;
                var o = t.memoizedState;
                i = o.element,
                zr(e, t),
                pa(t, l, null, n);
                var h = t.memoizedState;
                if (l = h.cache,
                vn(t, Ge, l),
                l !== o.cache && jr(t, [Ge], n, !0),
                ga(),
                l = h.element,
                o.isDehydrated)
                    if (o = {
                        element: l,
                        isDehydrated: !1,
                        cache: h.cache
                    },
                    t.updateQueue.baseState = o,
                    t.memoizedState = o,
                    t.flags & 256) {
                        t = bd(e, t, l, n);
                        break e
                    } else if (l !== i) {
                        i = _t(Error(u(424)), t),
                        oa(i),
                        t = bd(e, t, l, n);
                        break e
                    } else
                        for (e = t.stateNode.containerInfo,
                        e.nodeType === 9 ? e = e.body : e = e.nodeName === "HTML" ? e.ownerDocument.body : e,
                        Me = Ot(e.firstChild),
                        Fe = t,
                        ve = !0,
                        pn = null,
                        Tt = !0,
                        n = gf(t, null, l, n),
                        t.child = n; n; )
                            n.flags = n.flags & -3 | 4096,
                            n = n.sibling;
                else {
                    if (Xn(),
                    l === i) {
                        t = Pt(e, t, n);
                        break e
                    }
                    Ie(e, t, l, n)
                }
                t = t.child
            }
            return t;
        case 26:
            return ki(e, t),
            e === null ? (n = Dh(t.type, null, t.pendingProps, null)) ? t.memoizedState = n : ve || (n = t.type,
            e = t.pendingProps,
            l = ss(de.current).createElement(n),
            l[$e] = t,
            l[at] = e,
            Pe(l, n, e),
            Ke(l),
            t.stateNode = l) : t.memoizedState = Dh(t.type, e.memoizedProps, t.pendingProps, e.memoizedState),
            null;
        case 27:
            return Zl(t),
            e === null && ve && (l = t.stateNode = Mh(t.type, t.pendingProps, de.current),
            Fe = t,
            Tt = !0,
            i = Me,
            Rn(t.type) ? (Zu = i,
            Me = Ot(l.firstChild)) : Me = i),
            Ie(e, t, t.pendingProps.children, n),
            ki(e, t),
            e === null && (t.flags |= 4194304),
            t.child;
        case 5:
            return e === null && ve && ((i = l = Me) && (l = fy(l, t.type, t.pendingProps, Tt),
            l !== null ? (t.stateNode = l,
            Fe = t,
            Me = Ot(l.firstChild),
            Tt = !1,
            i = !0) : i = !1),
            i || yn(t)),
            Zl(t),
            i = t.type,
            o = t.pendingProps,
            h = e !== null ? e.memoizedProps : null,
            l = o.children,
            Vu(i, o) ? l = null : h !== null && Vu(i, h) && (t.flags |= 32),
            t.memoizedState !== null && (i = Yr(e, t, N0, null, null, n),
            Ua._currentValue = i),
            ki(e, t),
            Ie(e, t, l, n),
            t.child;
        case 6:
            return e === null && ve && ((e = n = Me) && (n = dy(n, t.pendingProps, Tt),
            n !== null ? (t.stateNode = n,
            Fe = t,
            Me = null,
            e = !0) : e = !1),
            e || yn(t)),
            null;
        case 13:
            return Sd(e, t, n);
        case 4:
            return nt(t, t.stateNode.containerInfo),
            l = t.pendingProps,
            e === null ? t.child = Wn(t, null, l, n) : Ie(e, t, l, n),
            t.child;
        case 11:
            return dd(e, t, t.type, t.pendingProps, n);
        case 7:
            return Ie(e, t, t.pendingProps, n),
            t.child;
        case 8:
            return Ie(e, t, t.pendingProps.children, n),
            t.child;
        case 12:
            return Ie(e, t, t.pendingProps.children, n),
            t.child;
        case 10:
            return l = t.pendingProps,
            vn(t, t.type, l.value),
            Ie(e, t, l.children, n),
            t.child;
        case 9:
            return i = t.type._context,
            l = t.pendingProps.children,
            Zn(t),
            i = We(i),
            l = l(i),
            t.flags |= 1,
            Ie(e, t, l, n),
            t.child;
        case 14:
            return hd(e, t, t.type, t.pendingProps, n);
        case 15:
            return md(e, t, t.type, t.pendingProps, n);
        case 19:
            return wd(e, t, n);
        case 31:
            return z0(e, t, n);
        case 22:
            return gd(e, t, n, t.pendingProps);
        case 24:
            return Zn(t),
            l = We(Ge),
            e === null ? (i = Rr(),
            i === null && (i = Re,
            o = Or(),
            i.pooledCache = o,
            o.refCount++,
            o !== null && (i.pooledCacheLanes |= n),
            i = o),
            t.memoizedState = {
                parent: l,
                cache: i
            },
            Lr(t),
            vn(t, Ge, i)) : ((e.lanes & n) !== 0 && (zr(e, t),
            pa(t, null, null, n),
            ga()),
            i = e.memoizedState,
            o = t.memoizedState,
            i.parent !== l ? (i = {
                parent: l,
                cache: l
            },
            t.memoizedState = i,
            t.lanes === 0 && (t.memoizedState = t.updateQueue.baseState = i),
            vn(t, Ge, l)) : (l = o.cache,
            vn(t, Ge, l),
            l !== i.cache && jr(t, [Ge], n, !0))),
            Ie(e, t, t.pendingProps.children, n),
            t.child;
        case 29:
            throw t.pendingProps
        }
        throw Error(u(156, t.tag))
    }
    function en(e) {
        e.flags |= 4
    }
    function gu(e, t, n, l, i) {
        if ((t = (e.mode & 32) !== 0) && (t = !1),
        t) {
            if (e.flags |= 16777216,
            (i & 335544128) === i)
                if (e.stateNode.complete)
                    e.flags |= 8192;
                else if (Wd())
                    e.flags |= 8192;
                else
                    throw Fn = ji,
                    Mr
        } else
            e.flags &= -16777217
    }
    function Cd(e, t) {
        if (t.type !== "stylesheet" || (t.state.loading & 4) !== 0)
            e.flags &= -16777217;
        else if (e.flags |= 16777216,
        !Gh(t))
            if (Wd())
                e.flags |= 8192;
            else
                throw Fn = ji,
                Mr
    }
    function Xi(e, t) {
        t !== null && (e.flags |= 4),
        e.flags & 16384 && (t = e.tag !== 22 ? lc() : 536870912,
        e.lanes |= t,
        Rl |= t)
    }
    function Ea(e, t) {
        if (!ve)
            switch (e.tailMode) {
            case "hidden":
                t = e.tail;
                for (var n = null; t !== null; )
                    t.alternate !== null && (n = t),
                    t = t.sibling;
                n === null ? e.tail = null : n.sibling = null;
                break;
            case "collapsed":
                n = e.tail;
                for (var l = null; n !== null; )
                    n.alternate !== null && (l = n),
                    n = n.sibling;
                l === null ? t || e.tail === null ? e.tail = null : e.tail.sibling = null : l.sibling = null
            }
    }
    function Le(e) {
        var t = e.alternate !== null && e.alternate.child === e.child
          , n = 0
          , l = 0;
        if (t)
            for (var i = e.child; i !== null; )
                n |= i.lanes | i.childLanes,
                l |= i.subtreeFlags & 65011712,
                l |= i.flags & 65011712,
                i.return = e,
                i = i.sibling;
        else
            for (i = e.child; i !== null; )
                n |= i.lanes | i.childLanes,
                l |= i.subtreeFlags,
                l |= i.flags,
                i.return = e,
                i = i.sibling;
        return e.subtreeFlags |= l,
        e.childLanes = n,
        t
    }
    function U0(e, t, n) {
        var l = t.pendingProps;
        switch (wr(t),
        t.tag) {
        case 16:
        case 15:
        case 0:
        case 11:
        case 7:
        case 8:
        case 12:
        case 9:
        case 14:
            return Le(t),
            null;
        case 1:
            return Le(t),
            null;
        case 3:
            return n = t.stateNode,
            l = null,
            e !== null && (l = e.memoizedState.cache),
            t.memoizedState.cache !== l && (t.flags |= 2048),
            Ft(Ge),
            He(),
            n.pendingContext && (n.context = n.pendingContext,
            n.pendingContext = null),
            (e === null || e.child === null) && (vl(t) ? en(t) : e === null || e.memoizedState.isDehydrated && (t.flags & 256) === 0 || (t.flags |= 1024,
            Cr())),
            Le(t),
            null;
        case 26:
            var i = t.type
              , o = t.memoizedState;
            return e === null ? (en(t),
            o !== null ? (Le(t),
            Cd(t, o)) : (Le(t),
            gu(t, i, null, l, n))) : o ? o !== e.memoizedState ? (en(t),
            Le(t),
            Cd(t, o)) : (Le(t),
            t.flags &= -16777217) : (e = e.memoizedProps,
            e !== l && en(t),
            Le(t),
            gu(t, i, e, l, n)),
            null;
        case 27:
            if (ni(t),
            n = de.current,
            i = t.type,
            e !== null && t.stateNode != null)
                e.memoizedProps !== l && en(t);
            else {
                if (!l) {
                    if (t.stateNode === null)
                        throw Error(u(166));
                    return Le(t),
                    null
                }
                e = $.current,
                vl(t) ? lf(t) : (e = Mh(i, l, n),
                t.stateNode = e,
                en(t))
            }
            return Le(t),
            null;
        case 5:
            if (ni(t),
            i = t.type,
            e !== null && t.stateNode != null)
                e.memoizedProps !== l && en(t);
            else {
                if (!l) {
                    if (t.stateNode === null)
                        throw Error(u(166));
                    return Le(t),
                    null
                }
                if (o = $.current,
                vl(t))
                    lf(t);
                else {
                    var h = ss(de.current);
                    switch (o) {
                    case 1:
                        o = h.createElementNS("http://www.w3.org/2000/svg", i);
                        break;
                    case 2:
                        o = h.createElementNS("http://www.w3.org/1998/Math/MathML", i);
                        break;
                    default:
                        switch (i) {
                        case "svg":
                            o = h.createElementNS("http://www.w3.org/2000/svg", i);
                            break;
                        case "math":
                            o = h.createElementNS("http://www.w3.org/1998/Math/MathML", i);
                            break;
                        case "script":
                            o = h.createElement("div"),
                            o.innerHTML = "<script><\/script>",
                            o = o.removeChild(o.firstChild);
                            break;
                        case "select":
                            o = typeof l.is == "string" ? h.createElement("select", {
                                is: l.is
                            }) : h.createElement("select"),
                            l.multiple ? o.multiple = !0 : l.size && (o.size = l.size);
                            break;
                        default:
                            o = typeof l.is == "string" ? h.createElement(i, {
                                is: l.is
                            }) : h.createElement(i)
                        }
                    }
                    o[$e] = t,
                    o[at] = l;
                    e: for (h = t.child; h !== null; ) {
                        if (h.tag === 5 || h.tag === 6)
                            o.appendChild(h.stateNode);
                        else if (h.tag !== 4 && h.tag !== 27 && h.child !== null) {
                            h.child.return = h,
                            h = h.child;
                            continue
                        }
                        if (h === t)
                            break e;
                        for (; h.sibling === null; ) {
                            if (h.return === null || h.return === t)
                                break e;
                            h = h.return
                        }
                        h.sibling.return = h.return,
                        h = h.sibling
                    }
                    t.stateNode = o;
                    e: switch (Pe(o, i, l),
                    i) {
                    case "button":
                    case "input":
                    case "select":
                    case "textarea":
                        l = !!l.autoFocus;
                        break e;
                    case "img":
                        l = !0;
                        break e;
                    default:
                        l = !1
                    }
                    l && en(t)
                }
            }
            return Le(t),
            gu(t, t.type, e === null ? null : e.memoizedProps, t.pendingProps, n),
            null;
        case 6:
            if (e && t.stateNode != null)
                e.memoizedProps !== l && en(t);
            else {
                if (typeof l != "string" && t.stateNode === null)
                    throw Error(u(166));
                if (e = de.current,
                vl(t)) {
                    if (e = t.stateNode,
                    n = t.memoizedProps,
                    l = null,
                    i = Fe,
                    i !== null)
                        switch (i.tag) {
                        case 27:
                        case 5:
                            l = i.memoizedProps
                        }
                    e[$e] = t,
                    e = !!(e.nodeValue === n || l !== null && l.suppressHydrationWarning === !0 || Sh(e.nodeValue, n)),
                    e || yn(t, !0)
                } else
                    e = ss(e).createTextNode(l),
                    e[$e] = t,
                    t.stateNode = e
            }
            return Le(t),
            null;
        case 31:
            if (n = t.memoizedState,
            e === null || e.memoizedState !== null) {
                if (l = vl(t),
                n !== null) {
                    if (e === null) {
                        if (!l)
                            throw Error(u(318));
                        if (e = t.memoizedState,
                        e = e !== null ? e.dehydrated : null,
                        !e)
                            throw Error(u(557));
                        e[$e] = t
                    } else
                        Xn(),
                        (t.flags & 128) === 0 && (t.memoizedState = null),
                        t.flags |= 4;
                    Le(t),
                    e = !1
                } else
                    n = Cr(),
                    e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = n),
                    e = !0;
                if (!e)
                    return t.flags & 256 ? (yt(t),
                    t) : (yt(t),
                    null);
                if ((t.flags & 128) !== 0)
                    throw Error(u(558))
            }
            return Le(t),
            null;
        case 13:
            if (l = t.memoizedState,
            e === null || e.memoizedState !== null && e.memoizedState.dehydrated !== null) {
                if (i = vl(t),
                l !== null && l.dehydrated !== null) {
                    if (e === null) {
                        if (!i)
                            throw Error(u(318));
                        if (i = t.memoizedState,
                        i = i !== null ? i.dehydrated : null,
                        !i)
                            throw Error(u(317));
                        i[$e] = t
                    } else
                        Xn(),
                        (t.flags & 128) === 0 && (t.memoizedState = null),
                        t.flags |= 4;
                    Le(t),
                    i = !1
                } else
                    i = Cr(),
                    e !== null && e.memoizedState !== null && (e.memoizedState.hydrationErrors = i),
                    i = !0;
                if (!i)
                    return t.flags & 256 ? (yt(t),
                    t) : (yt(t),
                    null)
            }
            return yt(t),
            (t.flags & 128) !== 0 ? (t.lanes = n,
            t) : (n = l !== null,
            e = e !== null && e.memoizedState !== null,
            n && (l = t.child,
            i = null,
            l.alternate !== null && l.alternate.memoizedState !== null && l.alternate.memoizedState.cachePool !== null && (i = l.alternate.memoizedState.cachePool.pool),
            o = null,
            l.memoizedState !== null && l.memoizedState.cachePool !== null && (o = l.memoizedState.cachePool.pool),
            o !== i && (l.flags |= 2048)),
            n !== e && n && (t.child.flags |= 8192),
            Xi(t, t.updateQueue),
            Le(t),
            null);
        case 4:
            return He(),
            e === null && Hu(t.stateNode.containerInfo),
            Le(t),
            null;
        case 10:
            return Ft(t.type),
            Le(t),
            null;
        case 19:
            if (B(Be),
            l = t.memoizedState,
            l === null)
                return Le(t),
                null;
            if (i = (t.flags & 128) !== 0,
            o = l.rendering,
            o === null)
                if (i)
                    Ea(l, !1);
                else {
                    if (Ue !== 0 || e !== null && (e.flags & 128) !== 0)
                        for (e = t.child; e !== null; ) {
                            if (o = Mi(e),
                            o !== null) {
                                for (t.flags |= 128,
                                Ea(l, !1),
                                e = o.updateQueue,
                                t.updateQueue = e,
                                Xi(t, e),
                                t.subtreeFlags = 0,
                                e = n,
                                n = t.child; n !== null; )
                                    Ic(n, e),
                                    n = n.sibling;
                                return K(Be, Be.current & 1 | 2),
                                ve && Jt(t, l.treeForkCount),
                                t.child
                            }
                            e = e.sibling
                        }
                    l.tail !== null && ft() > Fi && (t.flags |= 128,
                    i = !0,
                    Ea(l, !1),
                    t.lanes = 4194304)
                }
            else {
                if (!i)
                    if (e = Mi(o),
                    e !== null) {
                        if (t.flags |= 128,
                        i = !0,
                        e = e.updateQueue,
                        t.updateQueue = e,
                        Xi(t, e),
                        Ea(l, !0),
                        l.tail === null && l.tailMode === "hidden" && !o.alternate && !ve)
                            return Le(t),
                            null
                    } else
                        2 * ft() - l.renderingStartTime > Fi && n !== 536870912 && (t.flags |= 128,
                        i = !0,
                        Ea(l, !1),
                        t.lanes = 4194304);
                l.isBackwards ? (o.sibling = t.child,
                t.child = o) : (e = l.last,
                e !== null ? e.sibling = o : t.child = o,
                l.last = o)
            }
            return l.tail !== null ? (e = l.tail,
            l.rendering = e,
            l.tail = e.sibling,
            l.renderingStartTime = ft(),
            e.sibling = null,
            n = Be.current,
            K(Be, i ? n & 1 | 2 : n & 1),
            ve && Jt(t, l.treeForkCount),
            e) : (Le(t),
            null);
        case 22:
        case 23:
            return yt(t),
            Br(),
            l = t.memoizedState !== null,
            e !== null ? e.memoizedState !== null !== l && (t.flags |= 8192) : l && (t.flags |= 8192),
            l ? (n & 536870912) !== 0 && (t.flags & 128) === 0 && (Le(t),
            t.subtreeFlags & 6 && (t.flags |= 8192)) : Le(t),
            n = t.updateQueue,
            n !== null && Xi(t, n.retryQueue),
            n = null,
            e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool),
            l = null,
            t.memoizedState !== null && t.memoizedState.cachePool !== null && (l = t.memoizedState.cachePool.pool),
            l !== n && (t.flags |= 2048),
            e !== null && B(Jn),
            null;
        case 24:
            return n = null,
            e !== null && (n = e.memoizedState.cache),
            t.memoizedState.cache !== n && (t.flags |= 2048),
            Ft(Ge),
            Le(t),
            null;
        case 25:
            return null;
        case 30:
            return null
        }
        throw Error(u(156, t.tag))
    }
    function H0(e, t) {
        switch (wr(t),
        t.tag) {
        case 1:
            return e = t.flags,
            e & 65536 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 3:
            return Ft(Ge),
            He(),
            e = t.flags,
            (e & 65536) !== 0 && (e & 128) === 0 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 26:
        case 27:
        case 5:
            return ni(t),
            null;
        case 31:
            if (t.memoizedState !== null) {
                if (yt(t),
                t.alternate === null)
                    throw Error(u(340));
                Xn()
            }
            return e = t.flags,
            e & 65536 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 13:
            if (yt(t),
            e = t.memoizedState,
            e !== null && e.dehydrated !== null) {
                if (t.alternate === null)
                    throw Error(u(340));
                Xn()
            }
            return e = t.flags,
            e & 65536 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 19:
            return B(Be),
            null;
        case 4:
            return He(),
            null;
        case 10:
            return Ft(t.type),
            null;
        case 22:
        case 23:
            return yt(t),
            Br(),
            e !== null && B(Jn),
            e = t.flags,
            e & 65536 ? (t.flags = e & -65537 | 128,
            t) : null;
        case 24:
            return Ft(Ge),
            null;
        case 25:
            return null;
        default:
            return null
        }
    }
    function Nd(e, t) {
        switch (wr(t),
        t.tag) {
        case 3:
            Ft(Ge),
            He();
            break;
        case 26:
        case 27:
        case 5:
            ni(t);
            break;
        case 4:
            He();
            break;
        case 31:
            t.memoizedState !== null && yt(t);
            break;
        case 13:
            yt(t);
            break;
        case 19:
            B(Be);
            break;
        case 10:
            Ft(t.type);
            break;
        case 22:
        case 23:
            yt(t),
            Br(),
            e !== null && B(Jn);
            break;
        case 24:
            Ft(Ge)
        }
    }
    function wa(e, t) {
        try {
            var n = t.updateQueue
              , l = n !== null ? n.lastEffect : null;
            if (l !== null) {
                var i = l.next;
                n = i;
                do {
                    if ((n.tag & e) === e) {
                        l = void 0;
                        var o = n.create
                          , h = n.inst;
                        l = o(),
                        h.destroy = l
                    }
                    n = n.next
                } while (n !== i)
            }
        } catch (v) {
            Te(t, t.return, v)
        }
    }
    function _n(e, t, n) {
        try {
            var l = t.updateQueue
              , i = l !== null ? l.lastEffect : null;
            if (i !== null) {
                var o = i.next;
                l = o;
                do {
                    if ((l.tag & e) === e) {
                        var h = l.inst
                          , v = h.destroy;
                        if (v !== void 0) {
                            h.destroy = void 0,
                            i = t;
                            var C = n
                              , R = v;
                            try {
                                R()
                            } catch (U) {
                                Te(i, C, U)
                            }
                        }
                    }
                    l = l.next
                } while (l !== o)
            }
        } catch (U) {
            Te(t, t.return, U)
        }
    }
    function Td(e) {
        var t = e.updateQueue;
        if (t !== null) {
            var n = e.stateNode;
            try {
                yf(t, n)
            } catch (l) {
                Te(e, e.return, l)
            }
        }
    }
    function jd(e, t, n) {
        n.props = Pn(e.type, e.memoizedProps),
        n.state = e.memoizedState;
        try {
            n.componentWillUnmount()
        } catch (l) {
            Te(e, t, l)
        }
    }
    function _a(e, t) {
        try {
            var n = e.ref;
            if (n !== null) {
                switch (e.tag) {
                case 26:
                case 27:
                case 5:
                    var l = e.stateNode;
                    break;
                case 30:
                    l = e.stateNode;
                    break;
                default:
                    l = e.stateNode
                }
                typeof n == "function" ? e.refCleanup = n(l) : n.current = l
            }
        } catch (i) {
            Te(e, t, i)
        }
    }
    function Bt(e, t) {
        var n = e.ref
          , l = e.refCleanup;
        if (n !== null)
            if (typeof l == "function")
                try {
                    l()
                } catch (i) {
                    Te(e, t, i)
                } finally {
                    e.refCleanup = null,
                    e = e.alternate,
                    e != null && (e.refCleanup = null)
                }
            else if (typeof n == "function")
                try {
                    n(null)
                } catch (i) {
                    Te(e, t, i)
                }
            else
                n.current = null
    }
    function Od(e) {
        var t = e.type
          , n = e.memoizedProps
          , l = e.stateNode;
        try {
            e: switch (t) {
            case "button":
            case "input":
            case "select":
            case "textarea":
                n.autoFocus && l.focus();
                break e;
            case "img":
                n.src ? l.src = n.src : n.srcSet && (l.srcset = n.srcSet)
            }
        } catch (i) {
            Te(e, e.return, i)
        }
    }
    function pu(e, t, n) {
        try {
            var l = e.stateNode;
            iy(l, e.type, n, t),
            l[at] = t
        } catch (i) {
            Te(e, e.return, i)
        }
    }
    function Ad(e) {
        return e.tag === 5 || e.tag === 3 || e.tag === 26 || e.tag === 27 && Rn(e.type) || e.tag === 4
    }
    function yu(e) {
        e: for (; ; ) {
            for (; e.sibling === null; ) {
                if (e.return === null || Ad(e.return))
                    return null;
                e = e.return
            }
            for (e.sibling.return = e.return,
            e = e.sibling; e.tag !== 5 && e.tag !== 6 && e.tag !== 18; ) {
                if (e.tag === 27 && Rn(e.type) || e.flags & 2 || e.child === null || e.tag === 4)
                    continue e;
                e.child.return = e,
                e = e.child
            }
            if (!(e.flags & 2))
                return e.stateNode
        }
    }
    function vu(e, t, n) {
        var l = e.tag;
        if (l === 5 || l === 6)
            e = e.stateNode,
            t ? (n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n).insertBefore(e, t) : (t = n.nodeType === 9 ? n.body : n.nodeName === "HTML" ? n.ownerDocument.body : n,
            t.appendChild(e),
            n = n._reactRootContainer,
            n != null || t.onclick !== null || (t.onclick = Xt));
        else if (l !== 4 && (l === 27 && Rn(e.type) && (n = e.stateNode,
        t = null),
        e = e.child,
        e !== null))
            for (vu(e, t, n),
            e = e.sibling; e !== null; )
                vu(e, t, n),
                e = e.sibling
    }
    function Ki(e, t, n) {
        var l = e.tag;
        if (l === 5 || l === 6)
            e = e.stateNode,
            t ? n.insertBefore(e, t) : n.appendChild(e);
        else if (l !== 4 && (l === 27 && Rn(e.type) && (n = e.stateNode),
        e = e.child,
        e !== null))
            for (Ki(e, t, n),
            e = e.sibling; e !== null; )
                Ki(e, t, n),
                e = e.sibling
    }
    function Rd(e) {
        var t = e.stateNode
          , n = e.memoizedProps;
        try {
            for (var l = e.type, i = t.attributes; i.length; )
                t.removeAttributeNode(i[0]);
            Pe(t, l, n),
            t[$e] = e,
            t[at] = n
        } catch (o) {
            Te(e, e.return, o)
        }
    }
    var tn = !1
      , ke = !1
      , xu = !1
      , Md = typeof WeakSet == "function" ? WeakSet : Set
      , Ze = null;
    function B0(e, t) {
        if (e = e.containerInfo,
        Gu = hs,
        e = kc(e),
        dr(e)) {
            if ("selectionStart"in e)
                var n = {
                    start: e.selectionStart,
                    end: e.selectionEnd
                };
            else
                e: {
                    n = (n = e.ownerDocument) && n.defaultView || window;
                    var l = n.getSelection && n.getSelection();
                    if (l && l.rangeCount !== 0) {
                        n = l.anchorNode;
                        var i = l.anchorOffset
                          , o = l.focusNode;
                        l = l.focusOffset;
                        try {
                            n.nodeType,
                            o.nodeType
                        } catch {
                            n = null;
                            break e
                        }
                        var h = 0
                          , v = -1
                          , C = -1
                          , R = 0
                          , U = 0
                          , Y = e
                          , M = null;
                        t: for (; ; ) {
                            for (var z; Y !== n || i !== 0 && Y.nodeType !== 3 || (v = h + i),
                            Y !== o || l !== 0 && Y.nodeType !== 3 || (C = h + l),
                            Y.nodeType === 3 && (h += Y.nodeValue.length),
                            (z = Y.firstChild) !== null; )
                                M = Y,
                                Y = z;
                            for (; ; ) {
                                if (Y === e)
                                    break t;
                                if (M === n && ++R === i && (v = h),
                                M === o && ++U === l && (C = h),
                                (z = Y.nextSibling) !== null)
                                    break;
                                Y = M,
                                M = Y.parentNode
                            }
                            Y = z
                        }
                        n = v === -1 || C === -1 ? null : {
                            start: v,
                            end: C
                        }
                    } else
                        n = null
                }
            n = n || {
                start: 0,
                end: 0
            }
        } else
            n = null;
        for (Yu = {
            focusedElem: e,
            selectionRange: n
        },
        hs = !1,
        Ze = t; Ze !== null; )
            if (t = Ze,
            e = t.child,
            (t.subtreeFlags & 1028) !== 0 && e !== null)
                e.return = t,
                Ze = e;
            else
                for (; Ze !== null; ) {
                    switch (t = Ze,
                    o = t.alternate,
                    e = t.flags,
                    t.tag) {
                    case 0:
                        if ((e & 4) !== 0 && (e = t.updateQueue,
                        e = e !== null ? e.events : null,
                        e !== null))
                            for (n = 0; n < e.length; n++)
                                i = e[n],
                                i.ref.impl = i.nextImpl;
                        break;
                    case 11:
                    case 15:
                        break;
                    case 1:
                        if ((e & 1024) !== 0 && o !== null) {
                            e = void 0,
                            n = t,
                            i = o.memoizedProps,
                            o = o.memoizedState,
                            l = n.stateNode;
                            try {
                                var F = Pn(n.type, i);
                                e = l.getSnapshotBeforeUpdate(F, o),
                                l.__reactInternalSnapshotBeforeUpdate = e
                            } catch (le) {
                                Te(n, n.return, le)
                            }
                        }
                        break;
                    case 3:
                        if ((e & 1024) !== 0) {
                            if (e = t.stateNode.containerInfo,
                            n = e.nodeType,
                            n === 9)
                                Qu(e);
                            else if (n === 1)
                                switch (e.nodeName) {
                                case "HEAD":
                                case "HTML":
                                case "BODY":
                                    Qu(e);
                                    break;
                                default:
                                    e.textContent = ""
                                }
                        }
                        break;
                    case 5:
                    case 26:
                    case 27:
                    case 6:
                    case 4:
                    case 17:
                        break;
                    default:
                        if ((e & 1024) !== 0)
                            throw Error(u(163))
                    }
                    if (e = t.sibling,
                    e !== null) {
                        e.return = t.return,
                        Ze = e;
                        break
                    }
                    Ze = t.return
                }
    }
    function Ld(e, t, n) {
        var l = n.flags;
        switch (n.tag) {
        case 0:
        case 11:
        case 15:
            ln(e, n),
            l & 4 && wa(5, n);
            break;
        case 1:
            if (ln(e, n),
            l & 4)
                if (e = n.stateNode,
                t === null)
                    try {
                        e.componentDidMount()
                    } catch (h) {
                        Te(n, n.return, h)
                    }
                else {
                    var i = Pn(n.type, t.memoizedProps);
                    t = t.memoizedState;
                    try {
                        e.componentDidUpdate(i, t, e.__reactInternalSnapshotBeforeUpdate)
                    } catch (h) {
                        Te(n, n.return, h)
                    }
                }
            l & 64 && Td(n),
            l & 512 && _a(n, n.return);
            break;
        case 3:
            if (ln(e, n),
            l & 64 && (e = n.updateQueue,
            e !== null)) {
                if (t = null,
                n.child !== null)
                    switch (n.child.tag) {
                    case 27:
                    case 5:
                        t = n.child.stateNode;
                        break;
                    case 1:
                        t = n.child.stateNode
                    }
                try {
                    yf(e, t)
                } catch (h) {
                    Te(n, n.return, h)
                }
            }
            break;
        case 27:
            t === null && l & 4 && Rd(n);
        case 26:
        case 5:
            ln(e, n),
            t === null && l & 4 && Od(n),
            l & 512 && _a(n, n.return);
            break;
        case 12:
            ln(e, n);
            break;
        case 31:
            ln(e, n),
            l & 4 && Ud(e, n);
            break;
        case 13:
            ln(e, n),
            l & 4 && Hd(e, n),
            l & 64 && (e = n.memoizedState,
            e !== null && (e = e.dehydrated,
            e !== null && (n = Z0.bind(null, n),
            hy(e, n))));
            break;
        case 22:
            if (l = n.memoizedState !== null || tn,
            !l) {
                t = t !== null && t.memoizedState !== null || ke,
                i = tn;
                var o = ke;
                tn = l,
                (ke = t) && !o ? an(e, n, (n.subtreeFlags & 8772) !== 0) : ln(e, n),
                tn = i,
                ke = o
            }
            break;
        case 30:
            break;
        default:
            ln(e, n)
        }
    }
    function zd(e) {
        var t = e.alternate;
        t !== null && (e.alternate = null,
        zd(t)),
        e.child = null,
        e.deletions = null,
        e.sibling = null,
        e.tag === 5 && (t = e.stateNode,
        t !== null && $s(t)),
        e.stateNode = null,
        e.return = null,
        e.dependencies = null,
        e.memoizedProps = null,
        e.memoizedState = null,
        e.pendingProps = null,
        e.stateNode = null,
        e.updateQueue = null
    }
    var ze = null
      , st = !1;
    function nn(e, t, n) {
        for (n = n.child; n !== null; )
            Dd(e, t, n),
            n = n.sibling
    }
    function Dd(e, t, n) {
        if (dt && typeof dt.onCommitFiberUnmount == "function")
            try {
                dt.onCommitFiberUnmount(Jl, n)
            } catch {}
        switch (n.tag) {
        case 26:
            ke || Bt(n, t),
            nn(e, t, n),
            n.memoizedState ? n.memoizedState.count-- : n.stateNode && (n = n.stateNode,
            n.parentNode.removeChild(n));
            break;
        case 27:
            ke || Bt(n, t);
            var l = ze
              , i = st;
            Rn(n.type) && (ze = n.stateNode,
            st = !1),
            nn(e, t, n),
            La(n.stateNode),
            ze = l,
            st = i;
            break;
        case 5:
            ke || Bt(n, t);
        case 6:
            if (l = ze,
            i = st,
            ze = null,
            nn(e, t, n),
            ze = l,
            st = i,
            ze !== null)
                if (st)
                    try {
                        (ze.nodeType === 9 ? ze.body : ze.nodeName === "HTML" ? ze.ownerDocument.body : ze).removeChild(n.stateNode)
                    } catch (o) {
                        Te(n, t, o)
                    }
                else
                    try {
                        ze.removeChild(n.stateNode)
                    } catch (o) {
                        Te(n, t, o)
                    }
            break;
        case 18:
            ze !== null && (st ? (e = ze,
            Th(e.nodeType === 9 ? e.body : e.nodeName === "HTML" ? e.ownerDocument.body : e, n.stateNode),
            ql(e)) : Th(ze, n.stateNode));
            break;
        case 4:
            l = ze,
            i = st,
            ze = n.stateNode.containerInfo,
            st = !0,
            nn(e, t, n),
            ze = l,
            st = i;
            break;
        case 0:
        case 11:
        case 14:
        case 15:
            _n(2, n, t),
            ke || _n(4, n, t),
            nn(e, t, n);
            break;
        case 1:
            ke || (Bt(n, t),
            l = n.stateNode,
            typeof l.componentWillUnmount == "function" && jd(n, t, l)),
            nn(e, t, n);
            break;
        case 21:
            nn(e, t, n);
            break;
        case 22:
            ke = (l = ke) || n.memoizedState !== null,
            nn(e, t, n),
            ke = l;
            break;
        default:
            nn(e, t, n)
        }
    }
    function Ud(e, t) {
        if (t.memoizedState === null && (e = t.alternate,
        e !== null && (e = e.memoizedState,
        e !== null))) {
            e = e.dehydrated;
            try {
                ql(e)
            } catch (n) {
                Te(t, t.return, n)
            }
        }
    }
    function Hd(e, t) {
        if (t.memoizedState === null && (e = t.alternate,
        e !== null && (e = e.memoizedState,
        e !== null && (e = e.dehydrated,
        e !== null))))
            try {
                ql(e)
            } catch (n) {
                Te(t, t.return, n)
            }
    }
    function q0(e) {
        switch (e.tag) {
        case 31:
        case 13:
        case 19:
            var t = e.stateNode;
            return t === null && (t = e.stateNode = new Md),
            t;
        case 22:
            return e = e.stateNode,
            t = e._retryCache,
            t === null && (t = e._retryCache = new Md),
            t;
        default:
            throw Error(u(435, e.tag))
        }
    }
    function Zi(e, t) {
        var n = q0(e);
        t.forEach(function(l) {
            if (!n.has(l)) {
                n.add(l);
                var i = J0.bind(null, e, l);
                l.then(i, i)
            }
        })
    }
    function rt(e, t) {
        var n = t.deletions;
        if (n !== null)
            for (var l = 0; l < n.length; l++) {
                var i = n[l]
                  , o = e
                  , h = t
                  , v = h;
                e: for (; v !== null; ) {
                    switch (v.tag) {
                    case 27:
                        if (Rn(v.type)) {
                            ze = v.stateNode,
                            st = !1;
                            break e
                        }
                        break;
                    case 5:
                        ze = v.stateNode,
                        st = !1;
                        break e;
                    case 3:
                    case 4:
                        ze = v.stateNode.containerInfo,
                        st = !0;
                        break e
                    }
                    v = v.return
                }
                if (ze === null)
                    throw Error(u(160));
                Dd(o, h, i),
                ze = null,
                st = !1,
                o = i.alternate,
                o !== null && (o.return = null),
                i.return = null
            }
        if (t.subtreeFlags & 13886)
            for (t = t.child; t !== null; )
                Bd(t, e),
                t = t.sibling
    }
    var Lt = null;
    function Bd(e, t) {
        var n = e.alternate
          , l = e.flags;
        switch (e.tag) {
        case 0:
        case 11:
        case 14:
        case 15:
            rt(t, e),
            ut(e),
            l & 4 && (_n(3, e, e.return),
            wa(3, e),
            _n(5, e, e.return));
            break;
        case 1:
            rt(t, e),
            ut(e),
            l & 512 && (ke || n === null || Bt(n, n.return)),
            l & 64 && tn && (e = e.updateQueue,
            e !== null && (l = e.callbacks,
            l !== null && (n = e.shared.hiddenCallbacks,
            e.shared.hiddenCallbacks = n === null ? l : n.concat(l))));
            break;
        case 26:
            var i = Lt;
            if (rt(t, e),
            ut(e),
            l & 512 && (ke || n === null || Bt(n, n.return)),
            l & 4) {
                var o = n !== null ? n.memoizedState : null;
                if (l = e.memoizedState,
                n === null)
                    if (l === null)
                        if (e.stateNode === null) {
                            e: {
                                l = e.type,
                                n = e.memoizedProps,
                                i = i.ownerDocument || i;
                                t: switch (l) {
                                case "title":
                                    o = i.getElementsByTagName("title")[0],
                                    (!o || o[Wl] || o[$e] || o.namespaceURI === "http://www.w3.org/2000/svg" || o.hasAttribute("itemprop")) && (o = i.createElement(l),
                                    i.head.insertBefore(o, i.querySelector("head > title"))),
                                    Pe(o, l, n),
                                    o[$e] = e,
                                    Ke(o),
                                    l = o;
                                    break e;
                                case "link":
                                    var h = Bh("link", "href", i).get(l + (n.href || ""));
                                    if (h) {
                                        for (var v = 0; v < h.length; v++)
                                            if (o = h[v],
                                            o.getAttribute("href") === (n.href == null || n.href === "" ? null : n.href) && o.getAttribute("rel") === (n.rel == null ? null : n.rel) && o.getAttribute("title") === (n.title == null ? null : n.title) && o.getAttribute("crossorigin") === (n.crossOrigin == null ? null : n.crossOrigin)) {
                                                h.splice(v, 1);
                                                break t
                                            }
                                    }
                                    o = i.createElement(l),
                                    Pe(o, l, n),
                                    i.head.appendChild(o);
                                    break;
                                case "meta":
                                    if (h = Bh("meta", "content", i).get(l + (n.content || ""))) {
                                        for (v = 0; v < h.length; v++)
                                            if (o = h[v],
                                            o.getAttribute("content") === (n.content == null ? null : "" + n.content) && o.getAttribute("name") === (n.name == null ? null : n.name) && o.getAttribute("property") === (n.property == null ? null : n.property) && o.getAttribute("http-equiv") === (n.httpEquiv == null ? null : n.httpEquiv) && o.getAttribute("charset") === (n.charSet == null ? null : n.charSet)) {
                                                h.splice(v, 1);
                                                break t
                                            }
                                    }
                                    o = i.createElement(l),
                                    Pe(o, l, n),
                                    i.head.appendChild(o);
                                    break;
                                default:
                                    throw Error(u(468, l))
                                }
                                o[$e] = e,
                                Ke(o),
                                l = o
                            }
                            e.stateNode = l
                        } else
                            qh(i, e.type, e.stateNode);
                    else
                        e.stateNode = Hh(i, l, e.memoizedProps);
                else
                    o !== l ? (o === null ? n.stateNode !== null && (n = n.stateNode,
                    n.parentNode.removeChild(n)) : o.count--,
                    l === null ? qh(i, e.type, e.stateNode) : Hh(i, l, e.memoizedProps)) : l === null && e.stateNode !== null && pu(e, e.memoizedProps, n.memoizedProps)
            }
            break;
        case 27:
            rt(t, e),
            ut(e),
            l & 512 && (ke || n === null || Bt(n, n.return)),
            n !== null && l & 4 && pu(e, e.memoizedProps, n.memoizedProps);
            break;
        case 5:
            if (rt(t, e),
            ut(e),
            l & 512 && (ke || n === null || Bt(n, n.return)),
            e.flags & 32) {
                i = e.stateNode;
                try {
                    ul(i, "")
                } catch (F) {
                    Te(e, e.return, F)
                }
            }
            l & 4 && e.stateNode != null && (i = e.memoizedProps,
            pu(e, i, n !== null ? n.memoizedProps : i)),
            l & 1024 && (xu = !0);
            break;
        case 6:
            if (rt(t, e),
            ut(e),
            l & 4) {
                if (e.stateNode === null)
                    throw Error(u(162));
                l = e.memoizedProps,
                n = e.stateNode;
                try {
                    n.nodeValue = l
                } catch (F) {
                    Te(e, e.return, F)
                }
            }
            break;
        case 3:
            if (os = null,
            i = Lt,
            Lt = rs(t.containerInfo),
            rt(t, e),
            Lt = i,
            ut(e),
            l & 4 && n !== null && n.memoizedState.isDehydrated)
                try {
                    ql(t.containerInfo)
                } catch (F) {
                    Te(e, e.return, F)
                }
            xu && (xu = !1,
            qd(e));
            break;
        case 4:
            l = Lt,
            Lt = rs(e.stateNode.containerInfo),
            rt(t, e),
            ut(e),
            Lt = l;
            break;
        case 12:
            rt(t, e),
            ut(e);
            break;
        case 31:
            rt(t, e),
            ut(e),
            l & 4 && (l = e.updateQueue,
            l !== null && (e.updateQueue = null,
            Zi(e, l)));
            break;
        case 13:
            rt(t, e),
            ut(e),
            e.child.flags & 8192 && e.memoizedState !== null != (n !== null && n.memoizedState !== null) && ($i = ft()),
            l & 4 && (l = e.updateQueue,
            l !== null && (e.updateQueue = null,
            Zi(e, l)));
            break;
        case 22:
            i = e.memoizedState !== null;
            var C = n !== null && n.memoizedState !== null
              , R = tn
              , U = ke;
            if (tn = R || i,
            ke = U || C,
            rt(t, e),
            ke = U,
            tn = R,
            ut(e),
            l & 8192)
                e: for (t = e.stateNode,
                t._visibility = i ? t._visibility & -2 : t._visibility | 1,
                i && (n === null || C || tn || ke || el(e)),
                n = null,
                t = e; ; ) {
                    if (t.tag === 5 || t.tag === 26) {
                        if (n === null) {
                            C = n = t;
                            try {
                                if (o = C.stateNode,
                                i)
                                    h = o.style,
                                    typeof h.setProperty == "function" ? h.setProperty("display", "none", "important") : h.display = "none";
                                else {
                                    v = C.stateNode;
                                    var Y = C.memoizedProps.style
                                      , M = Y != null && Y.hasOwnProperty("display") ? Y.display : null;
                                    v.style.display = M == null || typeof M == "boolean" ? "" : ("" + M).trim()
                                }
                            } catch (F) {
                                Te(C, C.return, F)
                            }
                        }
                    } else if (t.tag === 6) {
                        if (n === null) {
                            C = t;
                            try {
                                C.stateNode.nodeValue = i ? "" : C.memoizedProps
                            } catch (F) {
                                Te(C, C.return, F)
                            }
                        }
                    } else if (t.tag === 18) {
                        if (n === null) {
                            C = t;
                            try {
                                var z = C.stateNode;
                                i ? jh(z, !0) : jh(C.stateNode, !1)
                            } catch (F) {
                                Te(C, C.return, F)
                            }
                        }
                    } else if ((t.tag !== 22 && t.tag !== 23 || t.memoizedState === null || t === e) && t.child !== null) {
                        t.child.return = t,
                        t = t.child;
                        continue
                    }
                    if (t === e)
                        break e;
                    for (; t.sibling === null; ) {
                        if (t.return === null || t.return === e)
                            break e;
                        n === t && (n = null),
                        t = t.return
                    }
                    n === t && (n = null),
                    t.sibling.return = t.return,
                    t = t.sibling
                }
            l & 4 && (l = e.updateQueue,
            l !== null && (n = l.retryQueue,
            n !== null && (l.retryQueue = null,
            Zi(e, n))));
            break;
        case 19:
            rt(t, e),
            ut(e),
            l & 4 && (l = e.updateQueue,
            l !== null && (e.updateQueue = null,
            Zi(e, l)));
            break;
        case 30:
            break;
        case 21:
            break;
        default:
            rt(t, e),
            ut(e)
        }
    }
    function ut(e) {
        var t = e.flags;
        if (t & 2) {
            try {
                for (var n, l = e.return; l !== null; ) {
                    if (Ad(l)) {
                        n = l;
                        break
                    }
                    l = l.return
                }
                if (n == null)
                    throw Error(u(160));
                switch (n.tag) {
                case 27:
                    var i = n.stateNode
                      , o = yu(e);
                    Ki(e, o, i);
                    break;
                case 5:
                    var h = n.stateNode;
                    n.flags & 32 && (ul(h, ""),
                    n.flags &= -33);
                    var v = yu(e);
                    Ki(e, v, h);
                    break;
                case 3:
                case 4:
                    var C = n.stateNode.containerInfo
                      , R = yu(e);
                    vu(e, R, C);
                    break;
                default:
                    throw Error(u(161))
                }
            } catch (U) {
                Te(e, e.return, U)
            }
            e.flags &= -3
        }
        t & 4096 && (e.flags &= -4097)
    }
    function qd(e) {
        if (e.subtreeFlags & 1024)
            for (e = e.child; e !== null; ) {
                var t = e;
                qd(t),
                t.tag === 5 && t.flags & 1024 && t.stateNode.reset(),
                e = e.sibling
            }
    }
    function ln(e, t) {
        if (t.subtreeFlags & 8772)
            for (t = t.child; t !== null; )
                Ld(e, t.alternate, t),
                t = t.sibling
    }
    function el(e) {
        for (e = e.child; e !== null; ) {
            var t = e;
            switch (t.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
                _n(4, t, t.return),
                el(t);
                break;
            case 1:
                Bt(t, t.return);
                var n = t.stateNode;
                typeof n.componentWillUnmount == "function" && jd(t, t.return, n),
                el(t);
                break;
            case 27:
                La(t.stateNode);
            case 26:
            case 5:
                Bt(t, t.return),
                el(t);
                break;
            case 22:
                t.memoizedState === null && el(t);
                break;
            case 30:
                el(t);
                break;
            default:
                el(t)
            }
            e = e.sibling
        }
    }
    function an(e, t, n) {
        for (n = n && (t.subtreeFlags & 8772) !== 0,
        t = t.child; t !== null; ) {
            var l = t.alternate
              , i = e
              , o = t
              , h = o.flags;
            switch (o.tag) {
            case 0:
            case 11:
            case 15:
                an(i, o, n),
                wa(4, o);
                break;
            case 1:
                if (an(i, o, n),
                l = o,
                i = l.stateNode,
                typeof i.componentDidMount == "function")
                    try {
                        i.componentDidMount()
                    } catch (R) {
                        Te(l, l.return, R)
                    }
                if (l = o,
                i = l.updateQueue,
                i !== null) {
                    var v = l.stateNode;
                    try {
                        var C = i.shared.hiddenCallbacks;
                        if (C !== null)
                            for (i.shared.hiddenCallbacks = null,
                            i = 0; i < C.length; i++)
                                pf(C[i], v)
                    } catch (R) {
                        Te(l, l.return, R)
                    }
                }
                n && h & 64 && Td(o),
                _a(o, o.return);
                break;
            case 27:
                Rd(o);
            case 26:
            case 5:
                an(i, o, n),
                n && l === null && h & 4 && Od(o),
                _a(o, o.return);
                break;
            case 12:
                an(i, o, n);
                break;
            case 31:
                an(i, o, n),
                n && h & 4 && Ud(i, o);
                break;
            case 13:
                an(i, o, n),
                n && h & 4 && Hd(i, o);
                break;
            case 22:
                o.memoizedState === null && an(i, o, n),
                _a(o, o.return);
                break;
            case 30:
                break;
            default:
                an(i, o, n)
            }
            t = t.sibling
        }
    }
    function bu(e, t) {
        var n = null;
        e !== null && e.memoizedState !== null && e.memoizedState.cachePool !== null && (n = e.memoizedState.cachePool.pool),
        e = null,
        t.memoizedState !== null && t.memoizedState.cachePool !== null && (e = t.memoizedState.cachePool.pool),
        e !== n && (e != null && e.refCount++,
        n != null && ca(n))
    }
    function Su(e, t) {
        e = null,
        t.alternate !== null && (e = t.alternate.memoizedState.cache),
        t = t.memoizedState.cache,
        t !== e && (t.refCount++,
        e != null && ca(e))
    }
    function zt(e, t, n, l) {
        if (t.subtreeFlags & 10256)
            for (t = t.child; t !== null; )
                Gd(e, t, n, l),
                t = t.sibling
    }
    function Gd(e, t, n, l) {
        var i = t.flags;
        switch (t.tag) {
        case 0:
        case 11:
        case 15:
            zt(e, t, n, l),
            i & 2048 && wa(9, t);
            break;
        case 1:
            zt(e, t, n, l);
            break;
        case 3:
            zt(e, t, n, l),
            i & 2048 && (e = null,
            t.alternate !== null && (e = t.alternate.memoizedState.cache),
            t = t.memoizedState.cache,
            t !== e && (t.refCount++,
            e != null && ca(e)));
            break;
        case 12:
            if (i & 2048) {
                zt(e, t, n, l),
                e = t.stateNode;
                try {
                    var o = t.memoizedProps
                      , h = o.id
                      , v = o.onPostCommit;
                    typeof v == "function" && v(h, t.alternate === null ? "mount" : "update", e.passiveEffectDuration, -0)
                } catch (C) {
                    Te(t, t.return, C)
                }
            } else
                zt(e, t, n, l);
            break;
        case 31:
            zt(e, t, n, l);
            break;
        case 13:
            zt(e, t, n, l);
            break;
        case 23:
            break;
        case 22:
            o = t.stateNode,
            h = t.alternate,
            t.memoizedState !== null ? o._visibility & 2 ? zt(e, t, n, l) : Ca(e, t) : o._visibility & 2 ? zt(e, t, n, l) : (o._visibility |= 2,
            jl(e, t, n, l, (t.subtreeFlags & 10256) !== 0 || !1)),
            i & 2048 && bu(h, t);
            break;
        case 24:
            zt(e, t, n, l),
            i & 2048 && Su(t.alternate, t);
            break;
        default:
            zt(e, t, n, l)
        }
    }
    function jl(e, t, n, l, i) {
        for (i = i && ((t.subtreeFlags & 10256) !== 0 || !1),
        t = t.child; t !== null; ) {
            var o = e
              , h = t
              , v = n
              , C = l
              , R = h.flags;
            switch (h.tag) {
            case 0:
            case 11:
            case 15:
                jl(o, h, v, C, i),
                wa(8, h);
                break;
            case 23:
                break;
            case 22:
                var U = h.stateNode;
                h.memoizedState !== null ? U._visibility & 2 ? jl(o, h, v, C, i) : Ca(o, h) : (U._visibility |= 2,
                jl(o, h, v, C, i)),
                i && R & 2048 && bu(h.alternate, h);
                break;
            case 24:
                jl(o, h, v, C, i),
                i && R & 2048 && Su(h.alternate, h);
                break;
            default:
                jl(o, h, v, C, i)
            }
            t = t.sibling
        }
    }
    function Ca(e, t) {
        if (t.subtreeFlags & 10256)
            for (t = t.child; t !== null; ) {
                var n = e
                  , l = t
                  , i = l.flags;
                switch (l.tag) {
                case 22:
                    Ca(n, l),
                    i & 2048 && bu(l.alternate, l);
                    break;
                case 24:
                    Ca(n, l),
                    i & 2048 && Su(l.alternate, l);
                    break;
                default:
                    Ca(n, l)
                }
                t = t.sibling
            }
    }
    var Na = 8192;
    function Ol(e, t, n) {
        if (e.subtreeFlags & Na)
            for (e = e.child; e !== null; )
                Yd(e, t, n),
                e = e.sibling
    }
    function Yd(e, t, n) {
        switch (e.tag) {
        case 26:
            Ol(e, t, n),
            e.flags & Na && e.memoizedState !== null && Cy(n, Lt, e.memoizedState, e.memoizedProps);
            break;
        case 5:
            Ol(e, t, n);
            break;
        case 3:
        case 4:
            var l = Lt;
            Lt = rs(e.stateNode.containerInfo),
            Ol(e, t, n),
            Lt = l;
            break;
        case 22:
            e.memoizedState === null && (l = e.alternate,
            l !== null && l.memoizedState !== null ? (l = Na,
            Na = 16777216,
            Ol(e, t, n),
            Na = l) : Ol(e, t, n));
            break;
        default:
            Ol(e, t, n)
        }
    }
    function Vd(e) {
        var t = e.alternate;
        if (t !== null && (e = t.child,
        e !== null)) {
            t.child = null;
            do
                t = e.sibling,
                e.sibling = null,
                e = t;
            while (e !== null)
        }
    }
    function Ta(e) {
        var t = e.deletions;
        if ((e.flags & 16) !== 0) {
            if (t !== null)
                for (var n = 0; n < t.length; n++) {
                    var l = t[n];
                    Ze = l,
                    Qd(l, e)
                }
            Vd(e)
        }
        if (e.subtreeFlags & 10256)
            for (e = e.child; e !== null; )
                kd(e),
                e = e.sibling
    }
    function kd(e) {
        switch (e.tag) {
        case 0:
        case 11:
        case 15:
            Ta(e),
            e.flags & 2048 && _n(9, e, e.return);
            break;
        case 3:
            Ta(e);
            break;
        case 12:
            Ta(e);
            break;
        case 22:
            var t = e.stateNode;
            e.memoizedState !== null && t._visibility & 2 && (e.return === null || e.return.tag !== 13) ? (t._visibility &= -3,
            Ji(e)) : Ta(e);
            break;
        default:
            Ta(e)
        }
    }
    function Ji(e) {
        var t = e.deletions;
        if ((e.flags & 16) !== 0) {
            if (t !== null)
                for (var n = 0; n < t.length; n++) {
                    var l = t[n];
                    Ze = l,
                    Qd(l, e)
                }
            Vd(e)
        }
        for (e = e.child; e !== null; ) {
            switch (t = e,
            t.tag) {
            case 0:
            case 11:
            case 15:
                _n(8, t, t.return),
                Ji(t);
                break;
            case 22:
                n = t.stateNode,
                n._visibility & 2 && (n._visibility &= -3,
                Ji(t));
                break;
            default:
                Ji(t)
            }
            e = e.sibling
        }
    }
    function Qd(e, t) {
        for (; Ze !== null; ) {
            var n = Ze;
            switch (n.tag) {
            case 0:
            case 11:
            case 15:
                _n(8, n, t);
                break;
            case 23:
            case 22:
                if (n.memoizedState !== null && n.memoizedState.cachePool !== null) {
                    var l = n.memoizedState.cachePool.pool;
                    l != null && l.refCount++
                }
                break;
            case 24:
                ca(n.memoizedState.cache)
            }
            if (l = n.child,
            l !== null)
                l.return = n,
                Ze = l;
            else
                e: for (n = e; Ze !== null; ) {
                    l = Ze;
                    var i = l.sibling
                      , o = l.return;
                    if (zd(l),
                    l === n) {
                        Ze = null;
                        break e
                    }
                    if (i !== null) {
                        i.return = o,
                        Ze = i;
                        break e
                    }
                    Ze = o
                }
        }
    }
    var G0 = {
        getCacheForType: function(e) {
            var t = We(Ge)
              , n = t.data.get(e);
            return n === void 0 && (n = e(),
            t.data.set(e, n)),
            n
        },
        cacheSignal: function() {
            return We(Ge).controller.signal
        }
    }
      , Y0 = typeof WeakMap == "function" ? WeakMap : Map
      , Ee = 0
      , Re = null
      , he = null
      , ge = 0
      , Ne = 0
      , vt = null
      , Cn = !1
      , Al = !1
      , Eu = !1
      , sn = 0
      , Ue = 0
      , Nn = 0
      , tl = 0
      , wu = 0
      , xt = 0
      , Rl = 0
      , ja = null
      , ot = null
      , _u = !1
      , $i = 0
      , Xd = 0
      , Fi = 1 / 0
      , Wi = null
      , Tn = null
      , Qe = 0
      , jn = null
      , Ml = null
      , rn = 0
      , Cu = 0
      , Nu = null
      , Kd = null
      , Oa = 0
      , Tu = null;
    function bt() {
        return (Ee & 2) !== 0 && ge !== 0 ? ge & -ge : D.T !== null ? Lu() : rc()
    }
    function Zd() {
        if (xt === 0)
            if ((ge & 536870912) === 0 || ve) {
                var e = ii;
                ii <<= 1,
                (ii & 3932160) === 0 && (ii = 262144),
                xt = e
            } else
                xt = 536870912;
        return e = pt.current,
        e !== null && (e.flags |= 32),
        xt
    }
    function ct(e, t, n) {
        (e === Re && (Ne === 2 || Ne === 9) || e.cancelPendingCommit !== null) && (Ll(e, 0),
        On(e, ge, xt, !1)),
        Fl(e, n),
        ((Ee & 2) === 0 || e !== Re) && (e === Re && ((Ee & 2) === 0 && (tl |= n),
        Ue === 4 && On(e, ge, xt, !1)),
        qt(e))
    }
    function Jd(e, t, n) {
        if ((Ee & 6) !== 0)
            throw Error(u(327));
        var l = !n && (t & 127) === 0 && (t & e.expiredLanes) === 0 || $l(e, t)
          , i = l ? Q0(e, t) : Ou(e, t, !0)
          , o = l;
        do {
            if (i === 0) {
                Al && !l && On(e, t, 0, !1);
                break
            } else {
                if (n = e.current.alternate,
                o && !V0(n)) {
                    i = Ou(e, t, !1),
                    o = !1;
                    continue
                }
                if (i === 2) {
                    if (o = t,
                    e.errorRecoveryDisabledLanes & o)
                        var h = 0;
                    else
                        h = e.pendingLanes & -536870913,
                        h = h !== 0 ? h : h & 536870912 ? 536870912 : 0;
                    if (h !== 0) {
                        t = h;
                        e: {
                            var v = e;
                            i = ja;
                            var C = v.current.memoizedState.isDehydrated;
                            if (C && (Ll(v, h).flags |= 256),
                            h = Ou(v, h, !1),
                            h !== 2) {
                                if (Eu && !C) {
                                    v.errorRecoveryDisabledLanes |= o,
                                    tl |= o,
                                    i = 4;
                                    break e
                                }
                                o = ot,
                                ot = i,
                                o !== null && (ot === null ? ot = o : ot.push.apply(ot, o))
                            }
                            i = h
                        }
                        if (o = !1,
                        i !== 2)
                            continue
                    }
                }
                if (i === 1) {
                    Ll(e, 0),
                    On(e, t, 0, !0);
                    break
                }
                e: {
                    switch (l = e,
                    o = i,
                    o) {
                    case 0:
                    case 1:
                        throw Error(u(345));
                    case 4:
                        if ((t & 4194048) !== t)
                            break;
                    case 6:
                        On(l, t, xt, !Cn);
                        break e;
                    case 2:
                        ot = null;
                        break;
                    case 3:
                    case 5:
                        break;
                    default:
                        throw Error(u(329))
                    }
                    if ((t & 62914560) === t && (i = $i + 300 - ft(),
                    10 < i)) {
                        if (On(l, t, xt, !Cn),
                        ri(l, 0, !0) !== 0)
                            break e;
                        rn = t,
                        l.timeoutHandle = Ch($d.bind(null, l, n, ot, Wi, _u, t, xt, tl, Rl, Cn, o, "Throttled", -0, 0), i);
                        break e
                    }
                    $d(l, n, ot, Wi, _u, t, xt, tl, Rl, Cn, o, null, -0, 0)
                }
            }
            break
        } while (!0);
        qt(e)
    }
    function $d(e, t, n, l, i, o, h, v, C, R, U, Y, M, z) {
        if (e.timeoutHandle = -1,
        Y = t.subtreeFlags,
        Y & 8192 || (Y & 16785408) === 16785408) {
            Y = {
                stylesheets: null,
                count: 0,
                imgCount: 0,
                imgBytes: 0,
                suspenseyImages: [],
                waitingForImages: !0,
                waitingForViewTransition: !1,
                unsuspend: Xt
            },
            Yd(t, o, Y);
            var F = (o & 62914560) === o ? $i - ft() : (o & 4194048) === o ? Xd - ft() : 0;
            if (F = Ny(Y, F),
            F !== null) {
                rn = o,
                e.cancelPendingCommit = F(lh.bind(null, e, t, o, n, l, i, h, v, C, U, Y, null, M, z)),
                On(e, o, h, !R);
                return
            }
        }
        lh(e, t, o, n, l, i, h, v, C)
    }
    function V0(e) {
        for (var t = e; ; ) {
            var n = t.tag;
            if ((n === 0 || n === 11 || n === 15) && t.flags & 16384 && (n = t.updateQueue,
            n !== null && (n = n.stores,
            n !== null)))
                for (var l = 0; l < n.length; l++) {
                    var i = n[l]
                      , o = i.getSnapshot;
                    i = i.value;
                    try {
                        if (!mt(o(), i))
                            return !1
                    } catch {
                        return !1
                    }
                }
            if (n = t.child,
            t.subtreeFlags & 16384 && n !== null)
                n.return = t,
                t = n;
            else {
                if (t === e)
                    break;
                for (; t.sibling === null; ) {
                    if (t.return === null || t.return === e)
                        return !0;
                    t = t.return
                }
                t.sibling.return = t.return,
                t = t.sibling
            }
        }
        return !0
    }
    function On(e, t, n, l) {
        t &= ~wu,
        t &= ~tl,
        e.suspendedLanes |= t,
        e.pingedLanes &= ~t,
        l && (e.warmLanes |= t),
        l = e.expirationTimes;
        for (var i = t; 0 < i; ) {
            var o = 31 - ht(i)
              , h = 1 << o;
            l[o] = -1,
            i &= ~h
        }
        n !== 0 && ac(e, n, t)
    }
    function Ii() {
        return (Ee & 6) === 0 ? (Aa(0),
        !1) : !0
    }
    function ju() {
        if (he !== null) {
            if (Ne === 0)
                var e = he.return;
            else
                e = he,
                $t = Kn = null,
                Qr(e),
                wl = null,
                da = 0,
                e = he;
            for (; e !== null; )
                Nd(e.alternate, e),
                e = e.return;
            he = null
        }
    }
    function Ll(e, t) {
        var n = e.timeoutHandle;
        n !== -1 && (e.timeoutHandle = -1,
        uy(n)),
        n = e.cancelPendingCommit,
        n !== null && (e.cancelPendingCommit = null,
        n()),
        rn = 0,
        ju(),
        Re = e,
        he = n = Zt(e.current, null),
        ge = t,
        Ne = 0,
        vt = null,
        Cn = !1,
        Al = $l(e, t),
        Eu = !1,
        Rl = xt = wu = tl = Nn = Ue = 0,
        ot = ja = null,
        _u = !1,
        (t & 8) !== 0 && (t |= t & 32);
        var l = e.entangledLanes;
        if (l !== 0)
            for (e = e.entanglements,
            l &= t; 0 < l; ) {
                var i = 31 - ht(l)
                  , o = 1 << i;
                t |= e[i],
                l &= ~o
            }
        return sn = t,
        xi(),
        n
    }
    function Fd(e, t) {
        re = null,
        D.H = ba,
        t === El || t === Ti ? (t = df(),
        Ne = 3) : t === Mr ? (t = df(),
        Ne = 4) : Ne = t === su ? 8 : t !== null && typeof t == "object" && typeof t.then == "function" ? 6 : 1,
        vt = t,
        he === null && (Ue = 1,
        Yi(e, _t(t, e.current)))
    }
    function Wd() {
        var e = pt.current;
        return e === null ? !0 : (ge & 4194048) === ge ? jt === null : (ge & 62914560) === ge || (ge & 536870912) !== 0 ? e === jt : !1
    }
    function Id() {
        var e = D.H;
        return D.H = ba,
        e === null ? ba : e
    }
    function Pd() {
        var e = D.A;
        return D.A = G0,
        e
    }
    function Pi() {
        Ue = 4,
        Cn || (ge & 4194048) !== ge && pt.current !== null || (Al = !0),
        (Nn & 134217727) === 0 && (tl & 134217727) === 0 || Re === null || On(Re, ge, xt, !1)
    }
    function Ou(e, t, n) {
        var l = Ee;
        Ee |= 2;
        var i = Id()
          , o = Pd();
        (Re !== e || ge !== t) && (Wi = null,
        Ll(e, t)),
        t = !1;
        var h = Ue;
        e: do
            try {
                if (Ne !== 0 && he !== null) {
                    var v = he
                      , C = vt;
                    switch (Ne) {
                    case 8:
                        ju(),
                        h = 6;
                        break e;
                    case 3:
                    case 2:
                    case 9:
                    case 6:
                        pt.current === null && (t = !0);
                        var R = Ne;
                        if (Ne = 0,
                        vt = null,
                        zl(e, v, C, R),
                        n && Al) {
                            h = 0;
                            break e
                        }
                        break;
                    default:
                        R = Ne,
                        Ne = 0,
                        vt = null,
                        zl(e, v, C, R)
                    }
                }
                k0(),
                h = Ue;
                break
            } catch (U) {
                Fd(e, U)
            }
        while (!0);
        return t && e.shellSuspendCounter++,
        $t = Kn = null,
        Ee = l,
        D.H = i,
        D.A = o,
        he === null && (Re = null,
        ge = 0,
        xi()),
        h
    }
    function k0() {
        for (; he !== null; )
            eh(he)
    }
    function Q0(e, t) {
        var n = Ee;
        Ee |= 2;
        var l = Id()
          , i = Pd();
        Re !== e || ge !== t ? (Wi = null,
        Fi = ft() + 500,
        Ll(e, t)) : Al = $l(e, t);
        e: do
            try {
                if (Ne !== 0 && he !== null) {
                    t = he;
                    var o = vt;
                    t: switch (Ne) {
                    case 1:
                        Ne = 0,
                        vt = null,
                        zl(e, t, o, 1);
                        break;
                    case 2:
                    case 9:
                        if (cf(o)) {
                            Ne = 0,
                            vt = null,
                            th(t);
                            break
                        }
                        t = function() {
                            Ne !== 2 && Ne !== 9 || Re !== e || (Ne = 7),
                            qt(e)
                        }
                        ,
                        o.then(t, t);
                        break e;
                    case 3:
                        Ne = 7;
                        break e;
                    case 4:
                        Ne = 5;
                        break e;
                    case 7:
                        cf(o) ? (Ne = 0,
                        vt = null,
                        th(t)) : (Ne = 0,
                        vt = null,
                        zl(e, t, o, 7));
                        break;
                    case 5:
                        var h = null;
                        switch (he.tag) {
                        case 26:
                            h = he.memoizedState;
                        case 5:
                        case 27:
                            var v = he;
                            if (h ? Gh(h) : v.stateNode.complete) {
                                Ne = 0,
                                vt = null;
                                var C = v.sibling;
                                if (C !== null)
                                    he = C;
                                else {
                                    var R = v.return;
                                    R !== null ? (he = R,
                                    es(R)) : he = null
                                }
                                break t
                            }
                        }
                        Ne = 0,
                        vt = null,
                        zl(e, t, o, 5);
                        break;
                    case 6:
                        Ne = 0,
                        vt = null,
                        zl(e, t, o, 6);
                        break;
                    case 8:
                        ju(),
                        Ue = 6;
                        break e;
                    default:
                        throw Error(u(462))
                    }
                }
                X0();
                break
            } catch (U) {
                Fd(e, U)
            }
        while (!0);
        return $t = Kn = null,
        D.H = l,
        D.A = i,
        Ee = n,
        he !== null ? 0 : (Re = null,
        ge = 0,
        xi(),
        Ue)
    }
    function X0() {
        for (; he !== null && !mp(); )
            eh(he)
    }
    function eh(e) {
        var t = _d(e.alternate, e, sn);
        e.memoizedProps = e.pendingProps,
        t === null ? es(e) : he = t
    }
    function th(e) {
        var t = e
          , n = t.alternate;
        switch (t.tag) {
        case 15:
        case 0:
            t = vd(n, t, t.pendingProps, t.type, void 0, ge);
            break;
        case 11:
            t = vd(n, t, t.pendingProps, t.type.render, t.ref, ge);
            break;
        case 5:
            Qr(t);
        default:
            Nd(n, t),
            t = he = Ic(t, sn),
            t = _d(n, t, sn)
        }
        e.memoizedProps = e.pendingProps,
        t === null ? es(e) : he = t
    }
    function zl(e, t, n, l) {
        $t = Kn = null,
        Qr(t),
        wl = null,
        da = 0;
        var i = t.return;
        try {
            if (L0(e, i, t, n, ge)) {
                Ue = 1,
                Yi(e, _t(n, e.current)),
                he = null;
                return
            }
        } catch (o) {
            if (i !== null)
                throw he = i,
                o;
            Ue = 1,
            Yi(e, _t(n, e.current)),
            he = null;
            return
        }
        t.flags & 32768 ? (ve || l === 1 ? e = !0 : Al || (ge & 536870912) !== 0 ? e = !1 : (Cn = e = !0,
        (l === 2 || l === 9 || l === 3 || l === 6) && (l = pt.current,
        l !== null && l.tag === 13 && (l.flags |= 16384))),
        nh(t, e)) : es(t)
    }
    function es(e) {
        var t = e;
        do {
            if ((t.flags & 32768) !== 0) {
                nh(t, Cn);
                return
            }
            e = t.return;
            var n = U0(t.alternate, t, sn);
            if (n !== null) {
                he = n;
                return
            }
            if (t = t.sibling,
            t !== null) {
                he = t;
                return
            }
            he = t = e
        } while (t !== null);
        Ue === 0 && (Ue = 5)
    }
    function nh(e, t) {
        do {
            var n = H0(e.alternate, e);
            if (n !== null) {
                n.flags &= 32767,
                he = n;
                return
            }
            if (n = e.return,
            n !== null && (n.flags |= 32768,
            n.subtreeFlags = 0,
            n.deletions = null),
            !t && (e = e.sibling,
            e !== null)) {
                he = e;
                return
            }
            he = e = n
        } while (e !== null);
        Ue = 6,
        he = null
    }
    function lh(e, t, n, l, i, o, h, v, C) {
        e.cancelPendingCommit = null;
        do
            ts();
        while (Qe !== 0);
        if ((Ee & 6) !== 0)
            throw Error(u(327));
        if (t !== null) {
            if (t === e.current)
                throw Error(u(177));
            if (o = t.lanes | t.childLanes,
            o |= yr,
            _p(e, n, o, h, v, C),
            e === Re && (he = Re = null,
            ge = 0),
            Ml = t,
            jn = e,
            rn = n,
            Cu = o,
            Nu = i,
            Kd = l,
            (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? (e.callbackNode = null,
            e.callbackPriority = 0,
            $0(li, function() {
                return uh(),
                null
            })) : (e.callbackNode = null,
            e.callbackPriority = 0),
            l = (t.flags & 13878) !== 0,
            (t.subtreeFlags & 13878) !== 0 || l) {
                l = D.T,
                D.T = null,
                i = Q.p,
                Q.p = 2,
                h = Ee,
                Ee |= 4;
                try {
                    B0(e, t, n)
                } finally {
                    Ee = h,
                    Q.p = i,
                    D.T = l
                }
            }
            Qe = 1,
            ah(),
            ih(),
            sh()
        }
    }
    function ah() {
        if (Qe === 1) {
            Qe = 0;
            var e = jn
              , t = Ml
              , n = (t.flags & 13878) !== 0;
            if ((t.subtreeFlags & 13878) !== 0 || n) {
                n = D.T,
                D.T = null;
                var l = Q.p;
                Q.p = 2;
                var i = Ee;
                Ee |= 4;
                try {
                    Bd(t, e);
                    var o = Yu
                      , h = kc(e.containerInfo)
                      , v = o.focusedElem
                      , C = o.selectionRange;
                    if (h !== v && v && v.ownerDocument && Vc(v.ownerDocument.documentElement, v)) {
                        if (C !== null && dr(v)) {
                            var R = C.start
                              , U = C.end;
                            if (U === void 0 && (U = R),
                            "selectionStart"in v)
                                v.selectionStart = R,
                                v.selectionEnd = Math.min(U, v.value.length);
                            else {
                                var Y = v.ownerDocument || document
                                  , M = Y && Y.defaultView || window;
                                if (M.getSelection) {
                                    var z = M.getSelection()
                                      , F = v.textContent.length
                                      , le = Math.min(C.start, F)
                                      , Ae = C.end === void 0 ? le : Math.min(C.end, F);
                                    !z.extend && le > Ae && (h = Ae,
                                    Ae = le,
                                    le = h);
                                    var O = Yc(v, le)
                                      , T = Yc(v, Ae);
                                    if (O && T && (z.rangeCount !== 1 || z.anchorNode !== O.node || z.anchorOffset !== O.offset || z.focusNode !== T.node || z.focusOffset !== T.offset)) {
                                        var A = Y.createRange();
                                        A.setStart(O.node, O.offset),
                                        z.removeAllRanges(),
                                        le > Ae ? (z.addRange(A),
                                        z.extend(T.node, T.offset)) : (A.setEnd(T.node, T.offset),
                                        z.addRange(A))
                                    }
                                }
                            }
                        }
                        for (Y = [],
                        z = v; z = z.parentNode; )
                            z.nodeType === 1 && Y.push({
                                element: z,
                                left: z.scrollLeft,
                                top: z.scrollTop
                            });
                        for (typeof v.focus == "function" && v.focus(),
                        v = 0; v < Y.length; v++) {
                            var q = Y[v];
                            q.element.scrollLeft = q.left,
                            q.element.scrollTop = q.top
                        }
                    }
                    hs = !!Gu,
                    Yu = Gu = null
                } finally {
                    Ee = i,
                    Q.p = l,
                    D.T = n
                }
            }
            e.current = t,
            Qe = 2
        }
    }
    function ih() {
        if (Qe === 2) {
            Qe = 0;
            var e = jn
              , t = Ml
              , n = (t.flags & 8772) !== 0;
            if ((t.subtreeFlags & 8772) !== 0 || n) {
                n = D.T,
                D.T = null;
                var l = Q.p;
                Q.p = 2;
                var i = Ee;
                Ee |= 4;
                try {
                    Ld(e, t.alternate, t)
                } finally {
                    Ee = i,
                    Q.p = l,
                    D.T = n
                }
            }
            Qe = 3
        }
    }
    function sh() {
        if (Qe === 4 || Qe === 3) {
            Qe = 0,
            gp();
            var e = jn
              , t = Ml
              , n = rn
              , l = Kd;
            (t.subtreeFlags & 10256) !== 0 || (t.flags & 10256) !== 0 ? Qe = 5 : (Qe = 0,
            Ml = jn = null,
            rh(e, e.pendingLanes));
            var i = e.pendingLanes;
            if (i === 0 && (Tn = null),
            Zs(n),
            t = t.stateNode,
            dt && typeof dt.onCommitFiberRoot == "function")
                try {
                    dt.onCommitFiberRoot(Jl, t, void 0, (t.current.flags & 128) === 128)
                } catch {}
            if (l !== null) {
                t = D.T,
                i = Q.p,
                Q.p = 2,
                D.T = null;
                try {
                    for (var o = e.onRecoverableError, h = 0; h < l.length; h++) {
                        var v = l[h];
                        o(v.value, {
                            componentStack: v.stack
                        })
                    }
                } finally {
                    D.T = t,
                    Q.p = i
                }
            }
            (rn & 3) !== 0 && ts(),
            qt(e),
            i = e.pendingLanes,
            (n & 261930) !== 0 && (i & 42) !== 0 ? e === Tu ? Oa++ : (Oa = 0,
            Tu = e) : Oa = 0,
            Aa(0)
        }
    }
    function rh(e, t) {
        (e.pooledCacheLanes &= t) === 0 && (t = e.pooledCache,
        t != null && (e.pooledCache = null,
        ca(t)))
    }
    function ts() {
        return ah(),
        ih(),
        sh(),
        uh()
    }
    function uh() {
        if (Qe !== 5)
            return !1;
        var e = jn
          , t = Cu;
        Cu = 0;
        var n = Zs(rn)
          , l = D.T
          , i = Q.p;
        try {
            Q.p = 32 > n ? 32 : n,
            D.T = null,
            n = Nu,
            Nu = null;
            var o = jn
              , h = rn;
            if (Qe = 0,
            Ml = jn = null,
            rn = 0,
            (Ee & 6) !== 0)
                throw Error(u(331));
            var v = Ee;
            if (Ee |= 4,
            kd(o.current),
            Gd(o, o.current, h, n),
            Ee = v,
            Aa(0, !1),
            dt && typeof dt.onPostCommitFiberRoot == "function")
                try {
                    dt.onPostCommitFiberRoot(Jl, o)
                } catch {}
            return !0
        } finally {
            Q.p = i,
            D.T = l,
            rh(e, t)
        }
    }
    function oh(e, t, n) {
        t = _t(n, t),
        t = iu(e.stateNode, t, 2),
        e = Sn(e, t, 2),
        e !== null && (Fl(e, 2),
        qt(e))
    }
    function Te(e, t, n) {
        if (e.tag === 3)
            oh(e, e, n);
        else
            for (; t !== null; ) {
                if (t.tag === 3) {
                    oh(t, e, n);
                    break
                } else if (t.tag === 1) {
                    var l = t.stateNode;
                    if (typeof t.type.getDerivedStateFromError == "function" || typeof l.componentDidCatch == "function" && (Tn === null || !Tn.has(l))) {
                        e = _t(n, e),
                        n = cd(2),
                        l = Sn(t, n, 2),
                        l !== null && (fd(n, l, t, e),
                        Fl(l, 2),
                        qt(l));
                        break
                    }
                }
                t = t.return
            }
    }
    function Au(e, t, n) {
        var l = e.pingCache;
        if (l === null) {
            l = e.pingCache = new Y0;
            var i = new Set;
            l.set(t, i)
        } else
            i = l.get(t),
            i === void 0 && (i = new Set,
            l.set(t, i));
        i.has(n) || (Eu = !0,
        i.add(n),
        e = K0.bind(null, e, t, n),
        t.then(e, e))
    }
    function K0(e, t, n) {
        var l = e.pingCache;
        l !== null && l.delete(t),
        e.pingedLanes |= e.suspendedLanes & n,
        e.warmLanes &= ~n,
        Re === e && (ge & n) === n && (Ue === 4 || Ue === 3 && (ge & 62914560) === ge && 300 > ft() - $i ? (Ee & 2) === 0 && Ll(e, 0) : wu |= n,
        Rl === ge && (Rl = 0)),
        qt(e)
    }
    function ch(e, t) {
        t === 0 && (t = lc()),
        e = kn(e, t),
        e !== null && (Fl(e, t),
        qt(e))
    }
    function Z0(e) {
        var t = e.memoizedState
          , n = 0;
        t !== null && (n = t.retryLane),
        ch(e, n)
    }
    function J0(e, t) {
        var n = 0;
        switch (e.tag) {
        case 31:
        case 13:
            var l = e.stateNode
              , i = e.memoizedState;
            i !== null && (n = i.retryLane);
            break;
        case 19:
            l = e.stateNode;
            break;
        case 22:
            l = e.stateNode._retryCache;
            break;
        default:
            throw Error(u(314))
        }
        l !== null && l.delete(t),
        ch(e, n)
    }
    function $0(e, t) {
        return ks(e, t)
    }
    var ns = null
      , Dl = null
      , Ru = !1
      , ls = !1
      , Mu = !1
      , An = 0;
    function qt(e) {
        e !== Dl && e.next === null && (Dl === null ? ns = Dl = e : Dl = Dl.next = e),
        ls = !0,
        Ru || (Ru = !0,
        W0())
    }
    function Aa(e, t) {
        if (!Mu && ls) {
            Mu = !0;
            do
                for (var n = !1, l = ns; l !== null; ) {
                    if (e !== 0) {
                        var i = l.pendingLanes;
                        if (i === 0)
                            var o = 0;
                        else {
                            var h = l.suspendedLanes
                              , v = l.pingedLanes;
                            o = (1 << 31 - ht(42 | e) + 1) - 1,
                            o &= i & ~(h & ~v),
                            o = o & 201326741 ? o & 201326741 | 1 : o ? o | 2 : 0
                        }
                        o !== 0 && (n = !0,
                        mh(l, o))
                    } else
                        o = ge,
                        o = ri(l, l === Re ? o : 0, l.cancelPendingCommit !== null || l.timeoutHandle !== -1),
                        (o & 3) === 0 || $l(l, o) || (n = !0,
                        mh(l, o));
                    l = l.next
                }
            while (n);
            Mu = !1
        }
    }
    function F0() {
        fh()
    }
    function fh() {
        ls = Ru = !1;
        var e = 0;
        An !== 0 && ry() && (e = An);
        for (var t = ft(), n = null, l = ns; l !== null; ) {
            var i = l.next
              , o = dh(l, t);
            o === 0 ? (l.next = null,
            n === null ? ns = i : n.next = i,
            i === null && (Dl = n)) : (n = l,
            (e !== 0 || (o & 3) !== 0) && (ls = !0)),
            l = i
        }
        Qe !== 0 && Qe !== 5 || Aa(e),
        An !== 0 && (An = 0)
    }
    function dh(e, t) {
        for (var n = e.suspendedLanes, l = e.pingedLanes, i = e.expirationTimes, o = e.pendingLanes & -62914561; 0 < o; ) {
            var h = 31 - ht(o)
              , v = 1 << h
              , C = i[h];
            C === -1 ? ((v & n) === 0 || (v & l) !== 0) && (i[h] = wp(v, t)) : C <= t && (e.expiredLanes |= v),
            o &= ~v
        }
        if (t = Re,
        n = ge,
        n = ri(e, e === t ? n : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1),
        l = e.callbackNode,
        n === 0 || e === t && (Ne === 2 || Ne === 9) || e.cancelPendingCommit !== null)
            return l !== null && l !== null && Qs(l),
            e.callbackNode = null,
            e.callbackPriority = 0;
        if ((n & 3) === 0 || $l(e, n)) {
            if (t = n & -n,
            t === e.callbackPriority)
                return t;
            switch (l !== null && Qs(l),
            Zs(n)) {
            case 2:
            case 8:
                n = tc;
                break;
            case 32:
                n = li;
                break;
            case 268435456:
                n = nc;
                break;
            default:
                n = li
            }
            return l = hh.bind(null, e),
            n = ks(n, l),
            e.callbackPriority = t,
            e.callbackNode = n,
            t
        }
        return l !== null && l !== null && Qs(l),
        e.callbackPriority = 2,
        e.callbackNode = null,
        2
    }
    function hh(e, t) {
        if (Qe !== 0 && Qe !== 5)
            return e.callbackNode = null,
            e.callbackPriority = 0,
            null;
        var n = e.callbackNode;
        if (ts() && e.callbackNode !== n)
            return null;
        var l = ge;
        return l = ri(e, e === Re ? l : 0, e.cancelPendingCommit !== null || e.timeoutHandle !== -1),
        l === 0 ? null : (Jd(e, l, t),
        dh(e, ft()),
        e.callbackNode != null && e.callbackNode === n ? hh.bind(null, e) : null)
    }
    function mh(e, t) {
        if (ts())
            return null;
        Jd(e, t, !0)
    }
    function W0() {
        oy(function() {
            (Ee & 6) !== 0 ? ks(ec, F0) : fh()
        })
    }
    function Lu() {
        if (An === 0) {
            var e = bl;
            e === 0 && (e = ai,
            ai <<= 1,
            (ai & 261888) === 0 && (ai = 256)),
            An = e
        }
        return An
    }
    function gh(e) {
        return e == null || typeof e == "symbol" || typeof e == "boolean" ? null : typeof e == "function" ? e : fi("" + e)
    }
    function ph(e, t) {
        var n = t.ownerDocument.createElement("input");
        return n.name = t.name,
        n.value = t.value,
        e.id && n.setAttribute("form", e.id),
        t.parentNode.insertBefore(n, t),
        e = new FormData(e),
        n.parentNode.removeChild(n),
        e
    }
    function I0(e, t, n, l, i) {
        if (t === "submit" && n && n.stateNode === i) {
            var o = gh((i[at] || null).action)
              , h = l.submitter;
            h && (t = (t = h[at] || null) ? gh(t.formAction) : h.getAttribute("formAction"),
            t !== null && (o = t,
            h = null));
            var v = new gi("action","action",null,l,i);
            e.push({
                event: v,
                listeners: [{
                    instance: null,
                    listener: function() {
                        if (l.defaultPrevented) {
                            if (An !== 0) {
                                var C = h ? ph(i, h) : new FormData(i);
                                Pr(n, {
                                    pending: !0,
                                    data: C,
                                    method: i.method,
                                    action: o
                                }, null, C)
                            }
                        } else
                            typeof o == "function" && (v.preventDefault(),
                            C = h ? ph(i, h) : new FormData(i),
                            Pr(n, {
                                pending: !0,
                                data: C,
                                method: i.method,
                                action: o
                            }, o, C))
                    },
                    currentTarget: i
                }]
            })
        }
    }
    for (var zu = 0; zu < pr.length; zu++) {
        var Du = pr[zu]
          , P0 = Du.toLowerCase()
          , ey = Du[0].toUpperCase() + Du.slice(1);
        Mt(P0, "on" + ey)
    }
    Mt(Kc, "onAnimationEnd"),
    Mt(Zc, "onAnimationIteration"),
    Mt(Jc, "onAnimationStart"),
    Mt("dblclick", "onDoubleClick"),
    Mt("focusin", "onFocus"),
    Mt("focusout", "onBlur"),
    Mt(p0, "onTransitionRun"),
    Mt(y0, "onTransitionStart"),
    Mt(v0, "onTransitionCancel"),
    Mt($c, "onTransitionEnd"),
    sl("onMouseEnter", ["mouseout", "mouseover"]),
    sl("onMouseLeave", ["mouseout", "mouseover"]),
    sl("onPointerEnter", ["pointerout", "pointerover"]),
    sl("onPointerLeave", ["pointerout", "pointerover"]),
    qn("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" ")),
    qn("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" ")),
    qn("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]),
    qn("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" ")),
    qn("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" ")),
    qn("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
    var Ra = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" ")
      , ty = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(Ra));
    function yh(e, t) {
        t = (t & 4) !== 0;
        for (var n = 0; n < e.length; n++) {
            var l = e[n]
              , i = l.event;
            l = l.listeners;
            e: {
                var o = void 0;
                if (t)
                    for (var h = l.length - 1; 0 <= h; h--) {
                        var v = l[h]
                          , C = v.instance
                          , R = v.currentTarget;
                        if (v = v.listener,
                        C !== o && i.isPropagationStopped())
                            break e;
                        o = v,
                        i.currentTarget = R;
                        try {
                            o(i)
                        } catch (U) {
                            vi(U)
                        }
                        i.currentTarget = null,
                        o = C
                    }
                else
                    for (h = 0; h < l.length; h++) {
                        if (v = l[h],
                        C = v.instance,
                        R = v.currentTarget,
                        v = v.listener,
                        C !== o && i.isPropagationStopped())
                            break e;
                        o = v,
                        i.currentTarget = R;
                        try {
                            o(i)
                        } catch (U) {
                            vi(U)
                        }
                        i.currentTarget = null,
                        o = C
                    }
            }
        }
    }
    function me(e, t) {
        var n = t[Js];
        n === void 0 && (n = t[Js] = new Set);
        var l = e + "__bubble";
        n.has(l) || (vh(t, e, 2, !1),
        n.add(l))
    }
    function Uu(e, t, n) {
        var l = 0;
        t && (l |= 4),
        vh(n, e, l, t)
    }
    var as = "_reactListening" + Math.random().toString(36).slice(2);
    function Hu(e) {
        if (!e[as]) {
            e[as] = !0,
            cc.forEach(function(n) {
                n !== "selectionchange" && (ty.has(n) || Uu(n, !1, e),
                Uu(n, !0, e))
            });
            var t = e.nodeType === 9 ? e : e.ownerDocument;
            t === null || t[as] || (t[as] = !0,
            Uu("selectionchange", !1, t))
        }
    }
    function vh(e, t, n, l) {
        switch (Zh(t)) {
        case 2:
            var i = Oy;
            break;
        case 8:
            i = Ay;
            break;
        default:
            i = Iu
        }
        n = i.bind(null, t, n, e),
        i = void 0,
        !lr || t !== "touchstart" && t !== "touchmove" && t !== "wheel" || (i = !0),
        l ? i !== void 0 ? e.addEventListener(t, n, {
            capture: !0,
            passive: i
        }) : e.addEventListener(t, n, !0) : i !== void 0 ? e.addEventListener(t, n, {
            passive: i
        }) : e.addEventListener(t, n, !1)
    }
    function Bu(e, t, n, l, i) {
        var o = l;
        if ((t & 1) === 0 && (t & 2) === 0 && l !== null)
            e: for (; ; ) {
                if (l === null)
                    return;
                var h = l.tag;
                if (h === 3 || h === 4) {
                    var v = l.stateNode.containerInfo;
                    if (v === i)
                        break;
                    if (h === 4)
                        for (h = l.return; h !== null; ) {
                            var C = h.tag;
                            if ((C === 3 || C === 4) && h.stateNode.containerInfo === i)
                                return;
                            h = h.return
                        }
                    for (; v !== null; ) {
                        if (h = ll(v),
                        h === null)
                            return;
                        if (C = h.tag,
                        C === 5 || C === 6 || C === 26 || C === 27) {
                            l = o = h;
                            continue e
                        }
                        v = v.parentNode
                    }
                }
                l = l.return
            }
        Ec(function() {
            var R = o
              , U = tr(n)
              , Y = [];
            e: {
                var M = Fc.get(e);
                if (M !== void 0) {
                    var z = gi
                      , F = e;
                    switch (e) {
                    case "keypress":
                        if (hi(n) === 0)
                            break e;
                    case "keydown":
                    case "keyup":
                        z = Jp;
                        break;
                    case "focusin":
                        F = "focus",
                        z = rr;
                        break;
                    case "focusout":
                        F = "blur",
                        z = rr;
                        break;
                    case "beforeblur":
                    case "afterblur":
                        z = rr;
                        break;
                    case "click":
                        if (n.button === 2)
                            break e;
                    case "auxclick":
                    case "dblclick":
                    case "mousedown":
                    case "mousemove":
                    case "mouseup":
                    case "mouseout":
                    case "mouseover":
                    case "contextmenu":
                        z = Cc;
                        break;
                    case "drag":
                    case "dragend":
                    case "dragenter":
                    case "dragexit":
                    case "dragleave":
                    case "dragover":
                    case "dragstart":
                    case "drop":
                        z = Up;
                        break;
                    case "touchcancel":
                    case "touchend":
                    case "touchmove":
                    case "touchstart":
                        z = Wp;
                        break;
                    case Kc:
                    case Zc:
                    case Jc:
                        z = qp;
                        break;
                    case $c:
                        z = Pp;
                        break;
                    case "scroll":
                    case "scrollend":
                        z = zp;
                        break;
                    case "wheel":
                        z = t0;
                        break;
                    case "copy":
                    case "cut":
                    case "paste":
                        z = Yp;
                        break;
                    case "gotpointercapture":
                    case "lostpointercapture":
                    case "pointercancel":
                    case "pointerdown":
                    case "pointermove":
                    case "pointerout":
                    case "pointerover":
                    case "pointerup":
                        z = Tc;
                        break;
                    case "toggle":
                    case "beforetoggle":
                        z = l0
                    }
                    var le = (t & 4) !== 0
                      , Ae = !le && (e === "scroll" || e === "scrollend")
                      , O = le ? M !== null ? M + "Capture" : null : M;
                    le = [];
                    for (var T = R, A; T !== null; ) {
                        var q = T;
                        if (A = q.stateNode,
                        q = q.tag,
                        q !== 5 && q !== 26 && q !== 27 || A === null || O === null || (q = Pl(T, O),
                        q != null && le.push(Ma(T, q, A))),
                        Ae)
                            break;
                        T = T.return
                    }
                    0 < le.length && (M = new z(M,F,null,n,U),
                    Y.push({
                        event: M,
                        listeners: le
                    }))
                }
            }
            if ((t & 7) === 0) {
                e: {
                    if (M = e === "mouseover" || e === "pointerover",
                    z = e === "mouseout" || e === "pointerout",
                    M && n !== er && (F = n.relatedTarget || n.fromElement) && (ll(F) || F[nl]))
                        break e;
                    if ((z || M) && (M = U.window === U ? U : (M = U.ownerDocument) ? M.defaultView || M.parentWindow : window,
                    z ? (F = n.relatedTarget || n.toElement,
                    z = R,
                    F = F ? ll(F) : null,
                    F !== null && (Ae = f(F),
                    le = F.tag,
                    F !== Ae || le !== 5 && le !== 27 && le !== 6) && (F = null)) : (z = null,
                    F = R),
                    z !== F)) {
                        if (le = Cc,
                        q = "onMouseLeave",
                        O = "onMouseEnter",
                        T = "mouse",
                        (e === "pointerout" || e === "pointerover") && (le = Tc,
                        q = "onPointerLeave",
                        O = "onPointerEnter",
                        T = "pointer"),
                        Ae = z == null ? M : Il(z),
                        A = F == null ? M : Il(F),
                        M = new le(q,T + "leave",z,n,U),
                        M.target = Ae,
                        M.relatedTarget = A,
                        q = null,
                        ll(U) === R && (le = new le(O,T + "enter",F,n,U),
                        le.target = A,
                        le.relatedTarget = Ae,
                        q = le),
                        Ae = q,
                        z && F)
                            t: {
                                for (le = ny,
                                O = z,
                                T = F,
                                A = 0,
                                q = O; q; q = le(q))
                                    A++;
                                q = 0;
                                for (var ee = T; ee; ee = le(ee))
                                    q++;
                                for (; 0 < A - q; )
                                    O = le(O),
                                    A--;
                                for (; 0 < q - A; )
                                    T = le(T),
                                    q--;
                                for (; A--; ) {
                                    if (O === T || T !== null && O === T.alternate) {
                                        le = O;
                                        break t
                                    }
                                    O = le(O),
                                    T = le(T)
                                }
                                le = null
                            }
                        else
                            le = null;
                        z !== null && xh(Y, M, z, le, !1),
                        F !== null && Ae !== null && xh(Y, Ae, F, le, !0)
                    }
                }
                e: {
                    if (M = R ? Il(R) : window,
                    z = M.nodeName && M.nodeName.toLowerCase(),
                    z === "select" || z === "input" && M.type === "file")
                        var be = Dc;
                    else if (Lc(M))
                        if (Uc)
                            be = h0;
                        else {
                            be = f0;
                            var P = c0
                        }
                    else
                        z = M.nodeName,
                        !z || z.toLowerCase() !== "input" || M.type !== "checkbox" && M.type !== "radio" ? R && Ps(R.elementType) && (be = Dc) : be = d0;
                    if (be && (be = be(e, R))) {
                        zc(Y, be, n, U);
                        break e
                    }
                    P && P(e, M, R),
                    e === "focusout" && R && M.type === "number" && R.memoizedProps.value != null && Is(M, "number", M.value)
                }
                switch (P = R ? Il(R) : window,
                e) {
                case "focusin":
                    (Lc(P) || P.contentEditable === "true") && (dl = P,
                    hr = R,
                    ra = null);
                    break;
                case "focusout":
                    ra = hr = dl = null;
                    break;
                case "mousedown":
                    mr = !0;
                    break;
                case "contextmenu":
                case "mouseup":
                case "dragend":
                    mr = !1,
                    Qc(Y, n, U);
                    break;
                case "selectionchange":
                    if (g0)
                        break;
                case "keydown":
                case "keyup":
                    Qc(Y, n, U)
                }
                var ce;
                if (or)
                    e: {
                        switch (e) {
                        case "compositionstart":
                            var pe = "onCompositionStart";
                            break e;
                        case "compositionend":
                            pe = "onCompositionEnd";
                            break e;
                        case "compositionupdate":
                            pe = "onCompositionUpdate";
                            break e
                        }
                        pe = void 0
                    }
                else
                    fl ? Rc(e, n) && (pe = "onCompositionEnd") : e === "keydown" && n.keyCode === 229 && (pe = "onCompositionStart");
                pe && (jc && n.locale !== "ko" && (fl || pe !== "onCompositionStart" ? pe === "onCompositionEnd" && fl && (ce = wc()) : (mn = U,
                ar = "value"in mn ? mn.value : mn.textContent,
                fl = !0)),
                P = is(R, pe),
                0 < P.length && (pe = new Nc(pe,e,null,n,U),
                Y.push({
                    event: pe,
                    listeners: P
                }),
                ce ? pe.data = ce : (ce = Mc(n),
                ce !== null && (pe.data = ce)))),
                (ce = i0 ? s0(e, n) : r0(e, n)) && (pe = is(R, "onBeforeInput"),
                0 < pe.length && (P = new Nc("onBeforeInput","beforeinput",null,n,U),
                Y.push({
                    event: P,
                    listeners: pe
                }),
                P.data = ce)),
                I0(Y, e, R, n, U)
            }
            yh(Y, t)
        })
    }
    function Ma(e, t, n) {
        return {
            instance: e,
            listener: t,
            currentTarget: n
        }
    }
    function is(e, t) {
        for (var n = t + "Capture", l = []; e !== null; ) {
            var i = e
              , o = i.stateNode;
            if (i = i.tag,
            i !== 5 && i !== 26 && i !== 27 || o === null || (i = Pl(e, n),
            i != null && l.unshift(Ma(e, i, o)),
            i = Pl(e, t),
            i != null && l.push(Ma(e, i, o))),
            e.tag === 3)
                return l;
            e = e.return
        }
        return []
    }
    function ny(e) {
        if (e === null)
            return null;
        do
            e = e.return;
        while (e && e.tag !== 5 && e.tag !== 27);
        return e || null
    }
    function xh(e, t, n, l, i) {
        for (var o = t._reactName, h = []; n !== null && n !== l; ) {
            var v = n
              , C = v.alternate
              , R = v.stateNode;
            if (v = v.tag,
            C !== null && C === l)
                break;
            v !== 5 && v !== 26 && v !== 27 || R === null || (C = R,
            i ? (R = Pl(n, o),
            R != null && h.unshift(Ma(n, R, C))) : i || (R = Pl(n, o),
            R != null && h.push(Ma(n, R, C)))),
            n = n.return
        }
        h.length !== 0 && e.push({
            event: t,
            listeners: h
        })
    }
    var ly = /\r\n?/g
      , ay = /\u0000|\uFFFD/g;
    function bh(e) {
        return (typeof e == "string" ? e : "" + e).replace(ly, `
`).replace(ay, "")
    }
    function Sh(e, t) {
        return t = bh(t),
        bh(e) === t
    }
    function Oe(e, t, n, l, i, o) {
        switch (n) {
        case "children":
            typeof l == "string" ? t === "body" || t === "textarea" && l === "" || ul(e, l) : (typeof l == "number" || typeof l == "bigint") && t !== "body" && ul(e, "" + l);
            break;
        case "className":
            oi(e, "class", l);
            break;
        case "tabIndex":
            oi(e, "tabindex", l);
            break;
        case "dir":
        case "role":
        case "viewBox":
        case "width":
        case "height":
            oi(e, n, l);
            break;
        case "style":
            bc(e, l, o);
            break;
        case "data":
            if (t !== "object") {
                oi(e, "data", l);
                break
            }
        case "src":
        case "href":
            if (l === "" && (t !== "a" || n !== "href")) {
                e.removeAttribute(n);
                break
            }
            if (l == null || typeof l == "function" || typeof l == "symbol" || typeof l == "boolean") {
                e.removeAttribute(n);
                break
            }
            l = fi("" + l),
            e.setAttribute(n, l);
            break;
        case "action":
        case "formAction":
            if (typeof l == "function") {
                e.setAttribute(n, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
                break
            } else
                typeof o == "function" && (n === "formAction" ? (t !== "input" && Oe(e, t, "name", i.name, i, null),
                Oe(e, t, "formEncType", i.formEncType, i, null),
                Oe(e, t, "formMethod", i.formMethod, i, null),
                Oe(e, t, "formTarget", i.formTarget, i, null)) : (Oe(e, t, "encType", i.encType, i, null),
                Oe(e, t, "method", i.method, i, null),
                Oe(e, t, "target", i.target, i, null)));
            if (l == null || typeof l == "symbol" || typeof l == "boolean") {
                e.removeAttribute(n);
                break
            }
            l = fi("" + l),
            e.setAttribute(n, l);
            break;
        case "onClick":
            l != null && (e.onclick = Xt);
            break;
        case "onScroll":
            l != null && me("scroll", e);
            break;
        case "onScrollEnd":
            l != null && me("scrollend", e);
            break;
        case "dangerouslySetInnerHTML":
            if (l != null) {
                if (typeof l != "object" || !("__html"in l))
                    throw Error(u(61));
                if (n = l.__html,
                n != null) {
                    if (i.children != null)
                        throw Error(u(60));
                    e.innerHTML = n
                }
            }
            break;
        case "multiple":
            e.multiple = l && typeof l != "function" && typeof l != "symbol";
            break;
        case "muted":
            e.muted = l && typeof l != "function" && typeof l != "symbol";
            break;
        case "suppressContentEditableWarning":
        case "suppressHydrationWarning":
        case "defaultValue":
        case "defaultChecked":
        case "innerHTML":
        case "ref":
            break;
        case "autoFocus":
            break;
        case "xlinkHref":
            if (l == null || typeof l == "function" || typeof l == "boolean" || typeof l == "symbol") {
                e.removeAttribute("xlink:href");
                break
            }
            n = fi("" + l),
            e.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", n);
            break;
        case "contentEditable":
        case "spellCheck":
        case "draggable":
        case "value":
        case "autoReverse":
        case "externalResourcesRequired":
        case "focusable":
        case "preserveAlpha":
            l != null && typeof l != "function" && typeof l != "symbol" ? e.setAttribute(n, "" + l) : e.removeAttribute(n);
            break;
        case "inert":
        case "allowFullScreen":
        case "async":
        case "autoPlay":
        case "controls":
        case "default":
        case "defer":
        case "disabled":
        case "disablePictureInPicture":
        case "disableRemotePlayback":
        case "formNoValidate":
        case "hidden":
        case "loop":
        case "noModule":
        case "noValidate":
        case "open":
        case "playsInline":
        case "readOnly":
        case "required":
        case "reversed":
        case "scoped":
        case "seamless":
        case "itemScope":
            l && typeof l != "function" && typeof l != "symbol" ? e.setAttribute(n, "") : e.removeAttribute(n);
            break;
        case "capture":
        case "download":
            l === !0 ? e.setAttribute(n, "") : l !== !1 && l != null && typeof l != "function" && typeof l != "symbol" ? e.setAttribute(n, l) : e.removeAttribute(n);
            break;
        case "cols":
        case "rows":
        case "size":
        case "span":
            l != null && typeof l != "function" && typeof l != "symbol" && !isNaN(l) && 1 <= l ? e.setAttribute(n, l) : e.removeAttribute(n);
            break;
        case "rowSpan":
        case "start":
            l == null || typeof l == "function" || typeof l == "symbol" || isNaN(l) ? e.removeAttribute(n) : e.setAttribute(n, l);
            break;
        case "popover":
            me("beforetoggle", e),
            me("toggle", e),
            ui(e, "popover", l);
            break;
        case "xlinkActuate":
            Qt(e, "http://www.w3.org/1999/xlink", "xlink:actuate", l);
            break;
        case "xlinkArcrole":
            Qt(e, "http://www.w3.org/1999/xlink", "xlink:arcrole", l);
            break;
        case "xlinkRole":
            Qt(e, "http://www.w3.org/1999/xlink", "xlink:role", l);
            break;
        case "xlinkShow":
            Qt(e, "http://www.w3.org/1999/xlink", "xlink:show", l);
            break;
        case "xlinkTitle":
            Qt(e, "http://www.w3.org/1999/xlink", "xlink:title", l);
            break;
        case "xlinkType":
            Qt(e, "http://www.w3.org/1999/xlink", "xlink:type", l);
            break;
        case "xmlBase":
            Qt(e, "http://www.w3.org/XML/1998/namespace", "xml:base", l);
            break;
        case "xmlLang":
            Qt(e, "http://www.w3.org/XML/1998/namespace", "xml:lang", l);
            break;
        case "xmlSpace":
            Qt(e, "http://www.w3.org/XML/1998/namespace", "xml:space", l);
            break;
        case "is":
            ui(e, "is", l);
            break;
        case "innerText":
        case "textContent":
            break;
        default:
            (!(2 < n.length) || n[0] !== "o" && n[0] !== "O" || n[1] !== "n" && n[1] !== "N") && (n = Mp.get(n) || n,
            ui(e, n, l))
        }
    }
    function qu(e, t, n, l, i, o) {
        switch (n) {
        case "style":
            bc(e, l, o);
            break;
        case "dangerouslySetInnerHTML":
            if (l != null) {
                if (typeof l != "object" || !("__html"in l))
                    throw Error(u(61));
                if (n = l.__html,
                n != null) {
                    if (i.children != null)
                        throw Error(u(60));
                    e.innerHTML = n
                }
            }
            break;
        case "children":
            typeof l == "string" ? ul(e, l) : (typeof l == "number" || typeof l == "bigint") && ul(e, "" + l);
            break;
        case "onScroll":
            l != null && me("scroll", e);
            break;
        case "onScrollEnd":
            l != null && me("scrollend", e);
            break;
        case "onClick":
            l != null && (e.onclick = Xt);
            break;
        case "suppressContentEditableWarning":
        case "suppressHydrationWarning":
        case "innerHTML":
        case "ref":
            break;
        case "innerText":
        case "textContent":
            break;
        default:
            if (!fc.hasOwnProperty(n))
                e: {
                    if (n[0] === "o" && n[1] === "n" && (i = n.endsWith("Capture"),
                    t = n.slice(2, i ? n.length - 7 : void 0),
                    o = e[at] || null,
                    o = o != null ? o[n] : null,
                    typeof o == "function" && e.removeEventListener(t, o, i),
                    typeof l == "function")) {
                        typeof o != "function" && o !== null && (n in e ? e[n] = null : e.hasAttribute(n) && e.removeAttribute(n)),
                        e.addEventListener(t, l, i);
                        break e
                    }
                    n in e ? e[n] = l : l === !0 ? e.setAttribute(n, "") : ui(e, n, l)
                }
        }
    }
    function Pe(e, t, n) {
        switch (t) {
        case "div":
        case "span":
        case "svg":
        case "path":
        case "a":
        case "g":
        case "p":
        case "li":
            break;
        case "img":
            me("error", e),
            me("load", e);
            var l = !1, i = !1, o;
            for (o in n)
                if (n.hasOwnProperty(o)) {
                    var h = n[o];
                    if (h != null)
                        switch (o) {
                        case "src":
                            l = !0;
                            break;
                        case "srcSet":
                            i = !0;
                            break;
                        case "children":
                        case "dangerouslySetInnerHTML":
                            throw Error(u(137, t));
                        default:
                            Oe(e, t, o, h, n, null)
                        }
                }
            i && Oe(e, t, "srcSet", n.srcSet, n, null),
            l && Oe(e, t, "src", n.src, n, null);
            return;
        case "input":
            me("invalid", e);
            var v = o = h = i = null
              , C = null
              , R = null;
            for (l in n)
                if (n.hasOwnProperty(l)) {
                    var U = n[l];
                    if (U != null)
                        switch (l) {
                        case "name":
                            i = U;
                            break;
                        case "type":
                            h = U;
                            break;
                        case "checked":
                            C = U;
                            break;
                        case "defaultChecked":
                            R = U;
                            break;
                        case "value":
                            o = U;
                            break;
                        case "defaultValue":
                            v = U;
                            break;
                        case "children":
                        case "dangerouslySetInnerHTML":
                            if (U != null)
                                throw Error(u(137, t));
                            break;
                        default:
                            Oe(e, t, l, U, n, null)
                        }
                }
            pc(e, o, v, C, R, h, i, !1);
            return;
        case "select":
            me("invalid", e),
            l = h = o = null;
            for (i in n)
                if (n.hasOwnProperty(i) && (v = n[i],
                v != null))
                    switch (i) {
                    case "value":
                        o = v;
                        break;
                    case "defaultValue":
                        h = v;
                        break;
                    case "multiple":
                        l = v;
                    default:
                        Oe(e, t, i, v, n, null)
                    }
            t = o,
            n = h,
            e.multiple = !!l,
            t != null ? rl(e, !!l, t, !1) : n != null && rl(e, !!l, n, !0);
            return;
        case "textarea":
            me("invalid", e),
            o = i = l = null;
            for (h in n)
                if (n.hasOwnProperty(h) && (v = n[h],
                v != null))
                    switch (h) {
                    case "value":
                        l = v;
                        break;
                    case "defaultValue":
                        i = v;
                        break;
                    case "children":
                        o = v;
                        break;
                    case "dangerouslySetInnerHTML":
                        if (v != null)
                            throw Error(u(91));
                        break;
                    default:
                        Oe(e, t, h, v, n, null)
                    }
            vc(e, l, i, o);
            return;
        case "option":
            for (C in n)
                n.hasOwnProperty(C) && (l = n[C],
                l != null) && (C === "selected" ? e.selected = l && typeof l != "function" && typeof l != "symbol" : Oe(e, t, C, l, n, null));
            return;
        case "dialog":
            me("beforetoggle", e),
            me("toggle", e),
            me("cancel", e),
            me("close", e);
            break;
        case "iframe":
        case "object":
            me("load", e);
            break;
        case "video":
        case "audio":
            for (l = 0; l < Ra.length; l++)
                me(Ra[l], e);
            break;
        case "image":
            me("error", e),
            me("load", e);
            break;
        case "details":
            me("toggle", e);
            break;
        case "embed":
        case "source":
        case "link":
            me("error", e),
            me("load", e);
        case "area":
        case "base":
        case "br":
        case "col":
        case "hr":
        case "keygen":
        case "meta":
        case "param":
        case "track":
        case "wbr":
        case "menuitem":
            for (R in n)
                if (n.hasOwnProperty(R) && (l = n[R],
                l != null))
                    switch (R) {
                    case "children":
                    case "dangerouslySetInnerHTML":
                        throw Error(u(137, t));
                    default:
                        Oe(e, t, R, l, n, null)
                    }
            return;
        default:
            if (Ps(t)) {
                for (U in n)
                    n.hasOwnProperty(U) && (l = n[U],
                    l !== void 0 && qu(e, t, U, l, n, void 0));
                return
            }
        }
        for (v in n)
            n.hasOwnProperty(v) && (l = n[v],
            l != null && Oe(e, t, v, l, n, null))
    }
    function iy(e, t, n, l) {
        switch (t) {
        case "div":
        case "span":
        case "svg":
        case "path":
        case "a":
        case "g":
        case "p":
        case "li":
            break;
        case "input":
            var i = null
              , o = null
              , h = null
              , v = null
              , C = null
              , R = null
              , U = null;
            for (z in n) {
                var Y = n[z];
                if (n.hasOwnProperty(z) && Y != null)
                    switch (z) {
                    case "checked":
                        break;
                    case "value":
                        break;
                    case "defaultValue":
                        C = Y;
                    default:
                        l.hasOwnProperty(z) || Oe(e, t, z, null, l, Y)
                    }
            }
            for (var M in l) {
                var z = l[M];
                if (Y = n[M],
                l.hasOwnProperty(M) && (z != null || Y != null))
                    switch (M) {
                    case "type":
                        o = z;
                        break;
                    case "name":
                        i = z;
                        break;
                    case "checked":
                        R = z;
                        break;
                    case "defaultChecked":
                        U = z;
                        break;
                    case "value":
                        h = z;
                        break;
                    case "defaultValue":
                        v = z;
                        break;
                    case "children":
                    case "dangerouslySetInnerHTML":
                        if (z != null)
                            throw Error(u(137, t));
                        break;
                    default:
                        z !== Y && Oe(e, t, M, z, l, Y)
                    }
            }
            Ws(e, h, v, C, R, U, o, i);
            return;
        case "select":
            z = h = v = M = null;
            for (o in n)
                if (C = n[o],
                n.hasOwnProperty(o) && C != null)
                    switch (o) {
                    case "value":
                        break;
                    case "multiple":
                        z = C;
                    default:
                        l.hasOwnProperty(o) || Oe(e, t, o, null, l, C)
                    }
            for (i in l)
                if (o = l[i],
                C = n[i],
                l.hasOwnProperty(i) && (o != null || C != null))
                    switch (i) {
                    case "value":
                        M = o;
                        break;
                    case "defaultValue":
                        v = o;
                        break;
                    case "multiple":
                        h = o;
                    default:
                        o !== C && Oe(e, t, i, o, l, C)
                    }
            t = v,
            n = h,
            l = z,
            M != null ? rl(e, !!n, M, !1) : !!l != !!n && (t != null ? rl(e, !!n, t, !0) : rl(e, !!n, n ? [] : "", !1));
            return;
        case "textarea":
            z = M = null;
            for (v in n)
                if (i = n[v],
                n.hasOwnProperty(v) && i != null && !l.hasOwnProperty(v))
                    switch (v) {
                    case "value":
                        break;
                    case "children":
                        break;
                    default:
                        Oe(e, t, v, null, l, i)
                    }
            for (h in l)
                if (i = l[h],
                o = n[h],
                l.hasOwnProperty(h) && (i != null || o != null))
                    switch (h) {
                    case "value":
                        M = i;
                        break;
                    case "defaultValue":
                        z = i;
                        break;
                    case "children":
                        break;
                    case "dangerouslySetInnerHTML":
                        if (i != null)
                            throw Error(u(91));
                        break;
                    default:
                        i !== o && Oe(e, t, h, i, l, o)
                    }
            yc(e, M, z);
            return;
        case "option":
            for (var F in n)
                M = n[F],
                n.hasOwnProperty(F) && M != null && !l.hasOwnProperty(F) && (F === "selected" ? e.selected = !1 : Oe(e, t, F, null, l, M));
            for (C in l)
                M = l[C],
                z = n[C],
                l.hasOwnProperty(C) && M !== z && (M != null || z != null) && (C === "selected" ? e.selected = M && typeof M != "function" && typeof M != "symbol" : Oe(e, t, C, M, l, z));
            return;
        case "img":
        case "link":
        case "area":
        case "base":
        case "br":
        case "col":
        case "embed":
        case "hr":
        case "keygen":
        case "meta":
        case "param":
        case "source":
        case "track":
        case "wbr":
        case "menuitem":
            for (var le in n)
                M = n[le],
                n.hasOwnProperty(le) && M != null && !l.hasOwnProperty(le) && Oe(e, t, le, null, l, M);
            for (R in l)
                if (M = l[R],
                z = n[R],
                l.hasOwnProperty(R) && M !== z && (M != null || z != null))
                    switch (R) {
                    case "children":
                    case "dangerouslySetInnerHTML":
                        if (M != null)
                            throw Error(u(137, t));
                        break;
                    default:
                        Oe(e, t, R, M, l, z)
                    }
            return;
        default:
            if (Ps(t)) {
                for (var Ae in n)
                    M = n[Ae],
                    n.hasOwnProperty(Ae) && M !== void 0 && !l.hasOwnProperty(Ae) && qu(e, t, Ae, void 0, l, M);
                for (U in l)
                    M = l[U],
                    z = n[U],
                    !l.hasOwnProperty(U) || M === z || M === void 0 && z === void 0 || qu(e, t, U, M, l, z);
                return
            }
        }
        for (var O in n)
            M = n[O],
            n.hasOwnProperty(O) && M != null && !l.hasOwnProperty(O) && Oe(e, t, O, null, l, M);
        for (Y in l)
            M = l[Y],
            z = n[Y],
            !l.hasOwnProperty(Y) || M === z || M == null && z == null || Oe(e, t, Y, M, l, z)
    }
    function Eh(e) {
        switch (e) {
        case "css":
        case "script":
        case "font":
        case "img":
        case "image":
        case "input":
        case "link":
            return !0;
        default:
            return !1
        }
    }
    function sy() {
        if (typeof performance.getEntriesByType == "function") {
            for (var e = 0, t = 0, n = performance.getEntriesByType("resource"), l = 0; l < n.length; l++) {
                var i = n[l]
                  , o = i.transferSize
                  , h = i.initiatorType
                  , v = i.duration;
                if (o && v && Eh(h)) {
                    for (h = 0,
                    v = i.responseEnd,
                    l += 1; l < n.length; l++) {
                        var C = n[l]
                          , R = C.startTime;
                        if (R > v)
                            break;
                        var U = C.transferSize
                          , Y = C.initiatorType;
                        U && Eh(Y) && (C = C.responseEnd,
                        h += U * (C < v ? 1 : (v - R) / (C - R)))
                    }
                    if (--l,
                    t += 8 * (o + h) / (i.duration / 1e3),
                    e++,
                    10 < e)
                        break
                }
            }
            if (0 < e)
                return t / e / 1e6
        }
        return navigator.connection && (e = navigator.connection.downlink,
        typeof e == "number") ? e : 5
    }
    var Gu = null
      , Yu = null;
    function ss(e) {
        return e.nodeType === 9 ? e : e.ownerDocument
    }
    function wh(e) {
        switch (e) {
        case "http://www.w3.org/2000/svg":
            return 1;
        case "http://www.w3.org/1998/Math/MathML":
            return 2;
        default:
            return 0
        }
    }
    function _h(e, t) {
        if (e === 0)
            switch (t) {
            case "svg":
                return 1;
            case "math":
                return 2;
            default:
                return 0
            }
        return e === 1 && t === "foreignObject" ? 0 : e
    }
    function Vu(e, t) {
        return e === "textarea" || e === "noscript" || typeof t.children == "string" || typeof t.children == "number" || typeof t.children == "bigint" || typeof t.dangerouslySetInnerHTML == "object" && t.dangerouslySetInnerHTML !== null && t.dangerouslySetInnerHTML.__html != null
    }
    var ku = null;
    function ry() {
        var e = window.event;
        return e && e.type === "popstate" ? e === ku ? !1 : (ku = e,
        !0) : (ku = null,
        !1)
    }
    var Ch = typeof setTimeout == "function" ? setTimeout : void 0
      , uy = typeof clearTimeout == "function" ? clearTimeout : void 0
      , Nh = typeof Promise == "function" ? Promise : void 0
      , oy = typeof queueMicrotask == "function" ? queueMicrotask : typeof Nh < "u" ? function(e) {
        return Nh.resolve(null).then(e).catch(cy)
    }
    : Ch;
    function cy(e) {
        setTimeout(function() {
            throw e
        })
    }
    function Rn(e) {
        return e === "head"
    }
    function Th(e, t) {
        var n = t
          , l = 0;
        do {
            var i = n.nextSibling;
            if (e.removeChild(n),
            i && i.nodeType === 8)
                if (n = i.data,
                n === "/$" || n === "/&") {
                    if (l === 0) {
                        e.removeChild(i),
                        ql(t);
                        return
                    }
                    l--
                } else if (n === "$" || n === "$?" || n === "$~" || n === "$!" || n === "&")
                    l++;
                else if (n === "html")
                    La(e.ownerDocument.documentElement);
                else if (n === "head") {
                    n = e.ownerDocument.head,
                    La(n);
                    for (var o = n.firstChild; o; ) {
                        var h = o.nextSibling
                          , v = o.nodeName;
                        o[Wl] || v === "SCRIPT" || v === "STYLE" || v === "LINK" && o.rel.toLowerCase() === "stylesheet" || n.removeChild(o),
                        o = h
                    }
                } else
                    n === "body" && La(e.ownerDocument.body);
            n = i
        } while (n);
        ql(t)
    }
    function jh(e, t) {
        var n = e;
        e = 0;
        do {
            var l = n.nextSibling;
            if (n.nodeType === 1 ? t ? (n._stashedDisplay = n.style.display,
            n.style.display = "none") : (n.style.display = n._stashedDisplay || "",
            n.getAttribute("style") === "" && n.removeAttribute("style")) : n.nodeType === 3 && (t ? (n._stashedText = n.nodeValue,
            n.nodeValue = "") : n.nodeValue = n._stashedText || ""),
            l && l.nodeType === 8)
                if (n = l.data,
                n === "/$") {
                    if (e === 0)
                        break;
                    e--
                } else
                    n !== "$" && n !== "$?" && n !== "$~" && n !== "$!" || e++;
            n = l
        } while (n)
    }
    function Qu(e) {
        var t = e.firstChild;
        for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
            var n = t;
            switch (t = t.nextSibling,
            n.nodeName) {
            case "HTML":
            case "HEAD":
            case "BODY":
                Qu(n),
                $s(n);
                continue;
            case "SCRIPT":
            case "STYLE":
                continue;
            case "LINK":
                if (n.rel.toLowerCase() === "stylesheet")
                    continue
            }
            e.removeChild(n)
        }
    }
    function fy(e, t, n, l) {
        for (; e.nodeType === 1; ) {
            var i = n;
            if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
                if (!l && (e.nodeName !== "INPUT" || e.type !== "hidden"))
                    break
            } else if (l) {
                if (!e[Wl])
                    switch (t) {
                    case "meta":
                        if (!e.hasAttribute("itemprop"))
                            break;
                        return e;
                    case "link":
                        if (o = e.getAttribute("rel"),
                        o === "stylesheet" && e.hasAttribute("data-precedence"))
                            break;
                        if (o !== i.rel || e.getAttribute("href") !== (i.href == null || i.href === "" ? null : i.href) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin) || e.getAttribute("title") !== (i.title == null ? null : i.title))
                            break;
                        return e;
                    case "style":
                        if (e.hasAttribute("data-precedence"))
                            break;
                        return e;
                    case "script":
                        if (o = e.getAttribute("src"),
                        (o !== (i.src == null ? null : i.src) || e.getAttribute("type") !== (i.type == null ? null : i.type) || e.getAttribute("crossorigin") !== (i.crossOrigin == null ? null : i.crossOrigin)) && o && e.hasAttribute("async") && !e.hasAttribute("itemprop"))
                            break;
                        return e;
                    default:
                        return e
                    }
            } else if (t === "input" && e.type === "hidden") {
                var o = i.name == null ? null : "" + i.name;
                if (i.type === "hidden" && e.getAttribute("name") === o)
                    return e
            } else
                return e;
            if (e = Ot(e.nextSibling),
            e === null)
                break
        }
        return null
    }
    function dy(e, t, n) {
        if (t === "")
            return null;
        for (; e.nodeType !== 3; )
            if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !n || (e = Ot(e.nextSibling),
            e === null))
                return null;
        return e
    }
    function Oh(e, t) {
        for (; e.nodeType !== 8; )
            if ((e.nodeType !== 1 || e.nodeName !== "INPUT" || e.type !== "hidden") && !t || (e = Ot(e.nextSibling),
            e === null))
                return null;
        return e
    }
    function Xu(e) {
        return e.data === "$?" || e.data === "$~"
    }
    function Ku(e) {
        return e.data === "$!" || e.data === "$?" && e.ownerDocument.readyState !== "loading"
    }
    function hy(e, t) {
        var n = e.ownerDocument;
        if (e.data === "$~")
            e._reactRetry = t;
        else if (e.data !== "$?" || n.readyState !== "loading")
            t();
        else {
            var l = function() {
                t(),
                n.removeEventListener("DOMContentLoaded", l)
            };
            n.addEventListener("DOMContentLoaded", l),
            e._reactRetry = l
        }
    }
    function Ot(e) {
        for (; e != null; e = e.nextSibling) {
            var t = e.nodeType;
            if (t === 1 || t === 3)
                break;
            if (t === 8) {
                if (t = e.data,
                t === "$" || t === "$!" || t === "$?" || t === "$~" || t === "&" || t === "F!" || t === "F")
                    break;
                if (t === "/$" || t === "/&")
                    return null
            }
        }
        return e
    }
    var Zu = null;
    function Ah(e) {
        e = e.nextSibling;
        for (var t = 0; e; ) {
            if (e.nodeType === 8) {
                var n = e.data;
                if (n === "/$" || n === "/&") {
                    if (t === 0)
                        return Ot(e.nextSibling);
                    t--
                } else
                    n !== "$" && n !== "$!" && n !== "$?" && n !== "$~" && n !== "&" || t++
            }
            e = e.nextSibling
        }
        return null
    }
    function Rh(e) {
        e = e.previousSibling;
        for (var t = 0; e; ) {
            if (e.nodeType === 8) {
                var n = e.data;
                if (n === "$" || n === "$!" || n === "$?" || n === "$~" || n === "&") {
                    if (t === 0)
                        return e;
                    t--
                } else
                    n !== "/$" && n !== "/&" || t++
            }
            e = e.previousSibling
        }
        return null
    }
    function Mh(e, t, n) {
        switch (t = ss(n),
        e) {
        case "html":
            if (e = t.documentElement,
            !e)
                throw Error(u(452));
            return e;
        case "head":
            if (e = t.head,
            !e)
                throw Error(u(453));
            return e;
        case "body":
            if (e = t.body,
            !e)
                throw Error(u(454));
            return e;
        default:
            throw Error(u(451))
        }
    }
    function La(e) {
        for (var t = e.attributes; t.length; )
            e.removeAttributeNode(t[0]);
        $s(e)
    }
    var At = new Map
      , Lh = new Set;
    function rs(e) {
        return typeof e.getRootNode == "function" ? e.getRootNode() : e.nodeType === 9 ? e : e.ownerDocument
    }
    var un = Q.d;
    Q.d = {
        f: my,
        r: gy,
        D: py,
        C: yy,
        L: vy,
        m: xy,
        X: Sy,
        S: by,
        M: Ey
    };
    function my() {
        var e = un.f()
          , t = Ii();
        return e || t
    }
    function gy(e) {
        var t = al(e);
        t !== null && t.tag === 5 && t.type === "form" ? Ff(t) : un.r(e)
    }
    var Ul = typeof document > "u" ? null : document;
    function zh(e, t, n) {
        var l = Ul;
        if (l && typeof t == "string" && t) {
            var i = Et(t);
            i = 'link[rel="' + e + '"][href="' + i + '"]',
            typeof n == "string" && (i += '[crossorigin="' + n + '"]'),
            Lh.has(i) || (Lh.add(i),
            e = {
                rel: e,
                crossOrigin: n,
                href: t
            },
            l.querySelector(i) === null && (t = l.createElement("link"),
            Pe(t, "link", e),
            Ke(t),
            l.head.appendChild(t)))
        }
    }
    function py(e) {
        un.D(e),
        zh("dns-prefetch", e, null)
    }
    function yy(e, t) {
        un.C(e, t),
        zh("preconnect", e, t)
    }
    function vy(e, t, n) {
        un.L(e, t, n);
        var l = Ul;
        if (l && e && t) {
            var i = 'link[rel="preload"][as="' + Et(t) + '"]';
            t === "image" && n && n.imageSrcSet ? (i += '[imagesrcset="' + Et(n.imageSrcSet) + '"]',
            typeof n.imageSizes == "string" && (i += '[imagesizes="' + Et(n.imageSizes) + '"]')) : i += '[href="' + Et(e) + '"]';
            var o = i;
            switch (t) {
            case "style":
                o = Hl(e);
                break;
            case "script":
                o = Bl(e)
            }
            At.has(o) || (e = x({
                rel: "preload",
                href: t === "image" && n && n.imageSrcSet ? void 0 : e,
                as: t
            }, n),
            At.set(o, e),
            l.querySelector(i) !== null || t === "style" && l.querySelector(za(o)) || t === "script" && l.querySelector(Da(o)) || (t = l.createElement("link"),
            Pe(t, "link", e),
            Ke(t),
            l.head.appendChild(t)))
        }
    }
    function xy(e, t) {
        un.m(e, t);
        var n = Ul;
        if (n && e) {
            var l = t && typeof t.as == "string" ? t.as : "script"
              , i = 'link[rel="modulepreload"][as="' + Et(l) + '"][href="' + Et(e) + '"]'
              , o = i;
            switch (l) {
            case "audioworklet":
            case "paintworklet":
            case "serviceworker":
            case "sharedworker":
            case "worker":
            case "script":
                o = Bl(e)
            }
            if (!At.has(o) && (e = x({
                rel: "modulepreload",
                href: e
            }, t),
            At.set(o, e),
            n.querySelector(i) === null)) {
                switch (l) {
                case "audioworklet":
                case "paintworklet":
                case "serviceworker":
                case "sharedworker":
                case "worker":
                case "script":
                    if (n.querySelector(Da(o)))
                        return
                }
                l = n.createElement("link"),
                Pe(l, "link", e),
                Ke(l),
                n.head.appendChild(l)
            }
        }
    }
    function by(e, t, n) {
        un.S(e, t, n);
        var l = Ul;
        if (l && e) {
            var i = il(l).hoistableStyles
              , o = Hl(e);
            t = t || "default";
            var h = i.get(o);
            if (!h) {
                var v = {
                    loading: 0,
                    preload: null
                };
                if (h = l.querySelector(za(o)))
                    v.loading = 5;
                else {
                    e = x({
                        rel: "stylesheet",
                        href: e,
                        "data-precedence": t
                    }, n),
                    (n = At.get(o)) && Ju(e, n);
                    var C = h = l.createElement("link");
                    Ke(C),
                    Pe(C, "link", e),
                    C._p = new Promise(function(R, U) {
                        C.onload = R,
                        C.onerror = U
                    }
                    ),
                    C.addEventListener("load", function() {
                        v.loading |= 1
                    }),
                    C.addEventListener("error", function() {
                        v.loading |= 2
                    }),
                    v.loading |= 4,
                    us(h, t, l)
                }
                h = {
                    type: "stylesheet",
                    instance: h,
                    count: 1,
                    state: v
                },
                i.set(o, h)
            }
        }
    }
    function Sy(e, t) {
        un.X(e, t);
        var n = Ul;
        if (n && e) {
            var l = il(n).hoistableScripts
              , i = Bl(e)
              , o = l.get(i);
            o || (o = n.querySelector(Da(i)),
            o || (e = x({
                src: e,
                async: !0
            }, t),
            (t = At.get(i)) && $u(e, t),
            o = n.createElement("script"),
            Ke(o),
            Pe(o, "link", e),
            n.head.appendChild(o)),
            o = {
                type: "script",
                instance: o,
                count: 1,
                state: null
            },
            l.set(i, o))
        }
    }
    function Ey(e, t) {
        un.M(e, t);
        var n = Ul;
        if (n && e) {
            var l = il(n).hoistableScripts
              , i = Bl(e)
              , o = l.get(i);
            o || (o = n.querySelector(Da(i)),
            o || (e = x({
                src: e,
                async: !0,
                type: "module"
            }, t),
            (t = At.get(i)) && $u(e, t),
            o = n.createElement("script"),
            Ke(o),
            Pe(o, "link", e),
            n.head.appendChild(o)),
            o = {
                type: "script",
                instance: o,
                count: 1,
                state: null
            },
            l.set(i, o))
        }
    }
    function Dh(e, t, n, l) {
        var i = (i = de.current) ? rs(i) : null;
        if (!i)
            throw Error(u(446));
        switch (e) {
        case "meta":
        case "title":
            return null;
        case "style":
            return typeof n.precedence == "string" && typeof n.href == "string" ? (t = Hl(n.href),
            n = il(i).hoistableStyles,
            l = n.get(t),
            l || (l = {
                type: "style",
                instance: null,
                count: 0,
                state: null
            },
            n.set(t, l)),
            l) : {
                type: "void",
                instance: null,
                count: 0,
                state: null
            };
        case "link":
            if (n.rel === "stylesheet" && typeof n.href == "string" && typeof n.precedence == "string") {
                e = Hl(n.href);
                var o = il(i).hoistableStyles
                  , h = o.get(e);
                if (h || (i = i.ownerDocument || i,
                h = {
                    type: "stylesheet",
                    instance: null,
                    count: 0,
                    state: {
                        loading: 0,
                        preload: null
                    }
                },
                o.set(e, h),
                (o = i.querySelector(za(e))) && !o._p && (h.instance = o,
                h.state.loading = 5),
                At.has(e) || (n = {
                    rel: "preload",
                    as: "style",
                    href: n.href,
                    crossOrigin: n.crossOrigin,
                    integrity: n.integrity,
                    media: n.media,
                    hrefLang: n.hrefLang,
                    referrerPolicy: n.referrerPolicy
                },
                At.set(e, n),
                o || wy(i, e, n, h.state))),
                t && l === null)
                    throw Error(u(528, ""));
                return h
            }
            if (t && l !== null)
                throw Error(u(529, ""));
            return null;
        case "script":
            return t = n.async,
            n = n.src,
            typeof n == "string" && t && typeof t != "function" && typeof t != "symbol" ? (t = Bl(n),
            n = il(i).hoistableScripts,
            l = n.get(t),
            l || (l = {
                type: "script",
                instance: null,
                count: 0,
                state: null
            },
            n.set(t, l)),
            l) : {
                type: "void",
                instance: null,
                count: 0,
                state: null
            };
        default:
            throw Error(u(444, e))
        }
    }
    function Hl(e) {
        return 'href="' + Et(e) + '"'
    }
    function za(e) {
        return 'link[rel="stylesheet"][' + e + "]"
    }
    function Uh(e) {
        return x({}, e, {
            "data-precedence": e.precedence,
            precedence: null
        })
    }
    function wy(e, t, n, l) {
        e.querySelector('link[rel="preload"][as="style"][' + t + "]") ? l.loading = 1 : (t = e.createElement("link"),
        l.preload = t,
        t.addEventListener("load", function() {
            return l.loading |= 1
        }),
        t.addEventListener("error", function() {
            return l.loading |= 2
        }),
        Pe(t, "link", n),
        Ke(t),
        e.head.appendChild(t))
    }
    function Bl(e) {
        return '[src="' + Et(e) + '"]'
    }
    function Da(e) {
        return "script[async]" + e
    }
    function Hh(e, t, n) {
        if (t.count++,
        t.instance === null)
            switch (t.type) {
            case "style":
                var l = e.querySelector('style[data-href~="' + Et(n.href) + '"]');
                if (l)
                    return t.instance = l,
                    Ke(l),
                    l;
                var i = x({}, n, {
                    "data-href": n.href,
                    "data-precedence": n.precedence,
                    href: null,
                    precedence: null
                });
                return l = (e.ownerDocument || e).createElement("style"),
                Ke(l),
                Pe(l, "style", i),
                us(l, n.precedence, e),
                t.instance = l;
            case "stylesheet":
                i = Hl(n.href);
                var o = e.querySelector(za(i));
                if (o)
                    return t.state.loading |= 4,
                    t.instance = o,
                    Ke(o),
                    o;
                l = Uh(n),
                (i = At.get(i)) && Ju(l, i),
                o = (e.ownerDocument || e).createElement("link"),
                Ke(o);
                var h = o;
                return h._p = new Promise(function(v, C) {
                    h.onload = v,
                    h.onerror = C
                }
                ),
                Pe(o, "link", l),
                t.state.loading |= 4,
                us(o, n.precedence, e),
                t.instance = o;
            case "script":
                return o = Bl(n.src),
                (i = e.querySelector(Da(o))) ? (t.instance = i,
                Ke(i),
                i) : (l = n,
                (i = At.get(o)) && (l = x({}, n),
                $u(l, i)),
                e = e.ownerDocument || e,
                i = e.createElement("script"),
                Ke(i),
                Pe(i, "link", l),
                e.head.appendChild(i),
                t.instance = i);
            case "void":
                return null;
            default:
                throw Error(u(443, t.type))
            }
        else
            t.type === "stylesheet" && (t.state.loading & 4) === 0 && (l = t.instance,
            t.state.loading |= 4,
            us(l, n.precedence, e));
        return t.instance
    }
    function us(e, t, n) {
        for (var l = n.querySelectorAll('link[rel="stylesheet"][data-precedence],style[data-precedence]'), i = l.length ? l[l.length - 1] : null, o = i, h = 0; h < l.length; h++) {
            var v = l[h];
            if (v.dataset.precedence === t)
                o = v;
            else if (o !== i)
                break
        }
        o ? o.parentNode.insertBefore(e, o.nextSibling) : (t = n.nodeType === 9 ? n.head : n,
        t.insertBefore(e, t.firstChild))
    }
    function Ju(e, t) {
        e.crossOrigin == null && (e.crossOrigin = t.crossOrigin),
        e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy),
        e.title == null && (e.title = t.title)
    }
    function $u(e, t) {
        e.crossOrigin == null && (e.crossOrigin = t.crossOrigin),
        e.referrerPolicy == null && (e.referrerPolicy = t.referrerPolicy),
        e.integrity == null && (e.integrity = t.integrity)
    }
    var os = null;
    function Bh(e, t, n) {
        if (os === null) {
            var l = new Map
              , i = os = new Map;
            i.set(n, l)
        } else
            i = os,
            l = i.get(n),
            l || (l = new Map,
            i.set(n, l));
        if (l.has(e))
            return l;
        for (l.set(e, null),
        n = n.getElementsByTagName(e),
        i = 0; i < n.length; i++) {
            var o = n[i];
            if (!(o[Wl] || o[$e] || e === "link" && o.getAttribute("rel") === "stylesheet") && o.namespaceURI !== "http://www.w3.org/2000/svg") {
                var h = o.getAttribute(t) || "";
                h = e + h;
                var v = l.get(h);
                v ? v.push(o) : l.set(h, [o])
            }
        }
        return l
    }
    function qh(e, t, n) {
        e = e.ownerDocument || e,
        e.head.insertBefore(n, t === "title" ? e.querySelector("head > title") : null)
    }
    function _y(e, t, n) {
        if (n === 1 || t.itemProp != null)
            return !1;
        switch (e) {
        case "meta":
        case "title":
            return !0;
        case "style":
            if (typeof t.precedence != "string" || typeof t.href != "string" || t.href === "")
                break;
            return !0;
        case "link":
            if (typeof t.rel != "string" || typeof t.href != "string" || t.href === "" || t.onLoad || t.onError)
                break;
            return t.rel === "stylesheet" ? (e = t.disabled,
            typeof t.precedence == "string" && e == null) : !0;
        case "script":
            if (t.async && typeof t.async != "function" && typeof t.async != "symbol" && !t.onLoad && !t.onError && t.src && typeof t.src == "string")
                return !0
        }
        return !1
    }
    function Gh(e) {
        return !(e.type === "stylesheet" && (e.state.loading & 3) === 0)
    }
    function Cy(e, t, n, l) {
        if (n.type === "stylesheet" && (typeof l.media != "string" || matchMedia(l.media).matches !== !1) && (n.state.loading & 4) === 0) {
            if (n.instance === null) {
                var i = Hl(l.href)
                  , o = t.querySelector(za(i));
                if (o) {
                    t = o._p,
                    t !== null && typeof t == "object" && typeof t.then == "function" && (e.count++,
                    e = cs.bind(e),
                    t.then(e, e)),
                    n.state.loading |= 4,
                    n.instance = o,
                    Ke(o);
                    return
                }
                o = t.ownerDocument || t,
                l = Uh(l),
                (i = At.get(i)) && Ju(l, i),
                o = o.createElement("link"),
                Ke(o);
                var h = o;
                h._p = new Promise(function(v, C) {
                    h.onload = v,
                    h.onerror = C
                }
                ),
                Pe(o, "link", l),
                n.instance = o
            }
            e.stylesheets === null && (e.stylesheets = new Map),
            e.stylesheets.set(n, t),
            (t = n.state.preload) && (n.state.loading & 3) === 0 && (e.count++,
            n = cs.bind(e),
            t.addEventListener("load", n),
            t.addEventListener("error", n))
        }
    }
    var Fu = 0;
    function Ny(e, t) {
        return e.stylesheets && e.count === 0 && ds(e, e.stylesheets),
        0 < e.count || 0 < e.imgCount ? function(n) {
            var l = setTimeout(function() {
                if (e.stylesheets && ds(e, e.stylesheets),
                e.unsuspend) {
                    var o = e.unsuspend;
                    e.unsuspend = null,
                    o()
                }
            }, 6e4 + t);
            0 < e.imgBytes && Fu === 0 && (Fu = 62500 * sy());
            var i = setTimeout(function() {
                if (e.waitingForImages = !1,
                e.count === 0 && (e.stylesheets && ds(e, e.stylesheets),
                e.unsuspend)) {
                    var o = e.unsuspend;
                    e.unsuspend = null,
                    o()
                }
            }, (e.imgBytes > Fu ? 50 : 800) + t);
            return e.unsuspend = n,
            function() {
                e.unsuspend = null,
                clearTimeout(l),
                clearTimeout(i)
            }
        }
        : null
    }
    function cs() {
        if (this.count--,
        this.count === 0 && (this.imgCount === 0 || !this.waitingForImages)) {
            if (this.stylesheets)
                ds(this, this.stylesheets);
            else if (this.unsuspend) {
                var e = this.unsuspend;
                this.unsuspend = null,
                e()
            }
        }
    }
    var fs = null;
    function ds(e, t) {
        e.stylesheets = null,
        e.unsuspend !== null && (e.count++,
        fs = new Map,
        t.forEach(Ty, e),
        fs = null,
        cs.call(e))
    }
    function Ty(e, t) {
        if (!(t.state.loading & 4)) {
            var n = fs.get(e);
            if (n)
                var l = n.get(null);
            else {
                n = new Map,
                fs.set(e, n);
                for (var i = e.querySelectorAll("link[data-precedence],style[data-precedence]"), o = 0; o < i.length; o++) {
                    var h = i[o];
                    (h.nodeName === "LINK" || h.getAttribute("media") !== "not all") && (n.set(h.dataset.precedence, h),
                    l = h)
                }
                l && n.set(null, l)
            }
            i = t.instance,
            h = i.getAttribute("data-precedence"),
            o = n.get(h) || l,
            o === l && n.set(null, i),
            n.set(h, i),
            this.count++,
            l = cs.bind(this),
            i.addEventListener("load", l),
            i.addEventListener("error", l),
            o ? o.parentNode.insertBefore(i, o.nextSibling) : (e = e.nodeType === 9 ? e.head : e,
            e.insertBefore(i, e.firstChild)),
            t.state.loading |= 4
        }
    }
    var Ua = {
        $$typeof: V,
        Provider: null,
        Consumer: null,
        _currentValue: te,
        _currentValue2: te,
        _threadCount: 0
    };
    function jy(e, t, n, l, i, o, h, v, C) {
        this.tag = 1,
        this.containerInfo = e,
        this.pingCache = this.current = this.pendingChildren = null,
        this.timeoutHandle = -1,
        this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null,
        this.callbackPriority = 0,
        this.expirationTimes = Xs(-1),
        this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0,
        this.entanglements = Xs(0),
        this.hiddenUpdates = Xs(null),
        this.identifierPrefix = l,
        this.onUncaughtError = i,
        this.onCaughtError = o,
        this.onRecoverableError = h,
        this.pooledCache = null,
        this.pooledCacheLanes = 0,
        this.formState = C,
        this.incompleteTransitions = new Map
    }
    function Yh(e, t, n, l, i, o, h, v, C, R, U, Y) {
        return e = new jy(e,t,n,h,C,R,U,Y,v),
        t = 1,
        o === !0 && (t |= 24),
        o = gt(3, null, null, t),
        e.current = o,
        o.stateNode = e,
        t = Or(),
        t.refCount++,
        e.pooledCache = t,
        t.refCount++,
        o.memoizedState = {
            element: l,
            isDehydrated: n,
            cache: t
        },
        Lr(o),
        e
    }
    function Vh(e) {
        return e ? (e = gl,
        e) : gl
    }
    function kh(e, t, n, l, i, o) {
        i = Vh(i),
        l.context === null ? l.context = i : l.pendingContext = i,
        l = bn(t),
        l.payload = {
            element: n
        },
        o = o === void 0 ? null : o,
        o !== null && (l.callback = o),
        n = Sn(e, l, t),
        n !== null && (ct(n, e, t),
        ma(n, e, t))
    }
    function Qh(e, t) {
        if (e = e.memoizedState,
        e !== null && e.dehydrated !== null) {
            var n = e.retryLane;
            e.retryLane = n !== 0 && n < t ? n : t
        }
    }
    function Wu(e, t) {
        Qh(e, t),
        (e = e.alternate) && Qh(e, t)
    }
    function Xh(e) {
        if (e.tag === 13 || e.tag === 31) {
            var t = kn(e, 67108864);
            t !== null && ct(t, e, 67108864),
            Wu(e, 67108864)
        }
    }
    function Kh(e) {
        if (e.tag === 13 || e.tag === 31) {
            var t = bt();
            t = Ks(t);
            var n = kn(e, t);
            n !== null && ct(n, e, t),
            Wu(e, t)
        }
    }
    var hs = !0;
    function Oy(e, t, n, l) {
        var i = D.T;
        D.T = null;
        var o = Q.p;
        try {
            Q.p = 2,
            Iu(e, t, n, l)
        } finally {
            Q.p = o,
            D.T = i
        }
    }
    function Ay(e, t, n, l) {
        var i = D.T;
        D.T = null;
        var o = Q.p;
        try {
            Q.p = 8,
            Iu(e, t, n, l)
        } finally {
            Q.p = o,
            D.T = i
        }
    }
    function Iu(e, t, n, l) {
        if (hs) {
            var i = Pu(l);
            if (i === null)
                Bu(e, t, l, ms, n),
                Jh(e, l);
            else if (My(i, e, t, n, l))
                l.stopPropagation();
            else if (Jh(e, l),
            t & 4 && -1 < Ry.indexOf(e)) {
                for (; i !== null; ) {
                    var o = al(i);
                    if (o !== null)
                        switch (o.tag) {
                        case 3:
                            if (o = o.stateNode,
                            o.current.memoizedState.isDehydrated) {
                                var h = Bn(o.pendingLanes);
                                if (h !== 0) {
                                    var v = o;
                                    for (v.pendingLanes |= 2,
                                    v.entangledLanes |= 2; h; ) {
                                        var C = 1 << 31 - ht(h);
                                        v.entanglements[1] |= C,
                                        h &= ~C
                                    }
                                    qt(o),
                                    (Ee & 6) === 0 && (Fi = ft() + 500,
                                    Aa(0))
                                }
                            }
                            break;
                        case 31:
                        case 13:
                            v = kn(o, 2),
                            v !== null && ct(v, o, 2),
                            Ii(),
                            Wu(o, 2)
                        }
                    if (o = Pu(l),
                    o === null && Bu(e, t, l, ms, n),
                    o === i)
                        break;
                    i = o
                }
                i !== null && l.stopPropagation()
            } else
                Bu(e, t, l, null, n)
        }
    }
    function Pu(e) {
        return e = tr(e),
        eo(e)
    }
    var ms = null;
    function eo(e) {
        if (ms = null,
        e = ll(e),
        e !== null) {
            var t = f(e);
            if (t === null)
                e = null;
            else {
                var n = t.tag;
                if (n === 13) {
                    if (e = d(t),
                    e !== null)
                        return e;
                    e = null
                } else if (n === 31) {
                    if (e = m(t),
                    e !== null)
                        return e;
                    e = null
                } else if (n === 3) {
                    if (t.stateNode.current.memoizedState.isDehydrated)
                        return t.tag === 3 ? t.stateNode.containerInfo : null;
                    e = null
                } else
                    t !== e && (e = null)
            }
        }
        return ms = e,
        null
    }
    function Zh(e) {
        switch (e) {
        case "beforetoggle":
        case "cancel":
        case "click":
        case "close":
        case "contextmenu":
        case "copy":
        case "cut":
        case "auxclick":
        case "dblclick":
        case "dragend":
        case "dragstart":
        case "drop":
        case "focusin":
        case "focusout":
        case "input":
        case "invalid":
        case "keydown":
        case "keypress":
        case "keyup":
        case "mousedown":
        case "mouseup":
        case "paste":
        case "pause":
        case "play":
        case "pointercancel":
        case "pointerdown":
        case "pointerup":
        case "ratechange":
        case "reset":
        case "resize":
        case "seeked":
        case "submit":
        case "toggle":
        case "touchcancel":
        case "touchend":
        case "touchstart":
        case "volumechange":
        case "change":
        case "selectionchange":
        case "textInput":
        case "compositionstart":
        case "compositionend":
        case "compositionupdate":
        case "beforeblur":
        case "afterblur":
        case "beforeinput":
        case "blur":
        case "fullscreenchange":
        case "focus":
        case "hashchange":
        case "popstate":
        case "select":
        case "selectstart":
            return 2;
        case "drag":
        case "dragenter":
        case "dragexit":
        case "dragleave":
        case "dragover":
        case "mousemove":
        case "mouseout":
        case "mouseover":
        case "pointermove":
        case "pointerout":
        case "pointerover":
        case "scroll":
        case "touchmove":
        case "wheel":
        case "mouseenter":
        case "mouseleave":
        case "pointerenter":
        case "pointerleave":
            return 8;
        case "message":
            switch (pp()) {
            case ec:
                return 2;
            case tc:
                return 8;
            case li:
            case yp:
                return 32;
            case nc:
                return 268435456;
            default:
                return 32
            }
        default:
            return 32
        }
    }
    var to = !1
      , Mn = null
      , Ln = null
      , zn = null
      , Ha = new Map
      , Ba = new Map
      , Dn = []
      , Ry = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
    function Jh(e, t) {
        switch (e) {
        case "focusin":
        case "focusout":
            Mn = null;
            break;
        case "dragenter":
        case "dragleave":
            Ln = null;
            break;
        case "mouseover":
        case "mouseout":
            zn = null;
            break;
        case "pointerover":
        case "pointerout":
            Ha.delete(t.pointerId);
            break;
        case "gotpointercapture":
        case "lostpointercapture":
            Ba.delete(t.pointerId)
        }
    }
    function qa(e, t, n, l, i, o) {
        return e === null || e.nativeEvent !== o ? (e = {
            blockedOn: t,
            domEventName: n,
            eventSystemFlags: l,
            nativeEvent: o,
            targetContainers: [i]
        },
        t !== null && (t = al(t),
        t !== null && Xh(t)),
        e) : (e.eventSystemFlags |= l,
        t = e.targetContainers,
        i !== null && t.indexOf(i) === -1 && t.push(i),
        e)
    }
    function My(e, t, n, l, i) {
        switch (t) {
        case "focusin":
            return Mn = qa(Mn, e, t, n, l, i),
            !0;
        case "dragenter":
            return Ln = qa(Ln, e, t, n, l, i),
            !0;
        case "mouseover":
            return zn = qa(zn, e, t, n, l, i),
            !0;
        case "pointerover":
            var o = i.pointerId;
            return Ha.set(o, qa(Ha.get(o) || null, e, t, n, l, i)),
            !0;
        case "gotpointercapture":
            return o = i.pointerId,
            Ba.set(o, qa(Ba.get(o) || null, e, t, n, l, i)),
            !0
        }
        return !1
    }
    function $h(e) {
        var t = ll(e.target);
        if (t !== null) {
            var n = f(t);
            if (n !== null) {
                if (t = n.tag,
                t === 13) {
                    if (t = d(n),
                    t !== null) {
                        e.blockedOn = t,
                        uc(e.priority, function() {
                            Kh(n)
                        });
                        return
                    }
                } else if (t === 31) {
                    if (t = m(n),
                    t !== null) {
                        e.blockedOn = t,
                        uc(e.priority, function() {
                            Kh(n)
                        });
                        return
                    }
                } else if (t === 3 && n.stateNode.current.memoizedState.isDehydrated) {
                    e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
                    return
                }
            }
        }
        e.blockedOn = null
    }
    function gs(e) {
        if (e.blockedOn !== null)
            return !1;
        for (var t = e.targetContainers; 0 < t.length; ) {
            var n = Pu(e.nativeEvent);
            if (n === null) {
                n = e.nativeEvent;
                var l = new n.constructor(n.type,n);
                er = l,
                n.target.dispatchEvent(l),
                er = null
            } else
                return t = al(n),
                t !== null && Xh(t),
                e.blockedOn = n,
                !1;
            t.shift()
        }
        return !0
    }
    function Fh(e, t, n) {
        gs(e) && n.delete(t)
    }
    function Ly() {
        to = !1,
        Mn !== null && gs(Mn) && (Mn = null),
        Ln !== null && gs(Ln) && (Ln = null),
        zn !== null && gs(zn) && (zn = null),
        Ha.forEach(Fh),
        Ba.forEach(Fh)
    }
    function ps(e, t) {
        e.blockedOn === t && (e.blockedOn = null,
        to || (to = !0,
        s.unstable_scheduleCallback(s.unstable_NormalPriority, Ly)))
    }
    var ys = null;
    function Wh(e) {
        ys !== e && (ys = e,
        s.unstable_scheduleCallback(s.unstable_NormalPriority, function() {
            ys === e && (ys = null);
            for (var t = 0; t < e.length; t += 3) {
                var n = e[t]
                  , l = e[t + 1]
                  , i = e[t + 2];
                if (typeof l != "function") {
                    if (eo(l || n) === null)
                        continue;
                    break
                }
                var o = al(n);
                o !== null && (e.splice(t, 3),
                t -= 3,
                Pr(o, {
                    pending: !0,
                    data: i,
                    method: n.method,
                    action: l
                }, l, i))
            }
        }))
    }
    function ql(e) {
        function t(C) {
            return ps(C, e)
        }
        Mn !== null && ps(Mn, e),
        Ln !== null && ps(Ln, e),
        zn !== null && ps(zn, e),
        Ha.forEach(t),
        Ba.forEach(t);
        for (var n = 0; n < Dn.length; n++) {
            var l = Dn[n];
            l.blockedOn === e && (l.blockedOn = null)
        }
        for (; 0 < Dn.length && (n = Dn[0],
        n.blockedOn === null); )
            $h(n),
            n.blockedOn === null && Dn.shift();
        if (n = (e.ownerDocument || e).$$reactFormReplay,
        n != null)
            for (l = 0; l < n.length; l += 3) {
                var i = n[l]
                  , o = n[l + 1]
                  , h = i[at] || null;
                if (typeof o == "function")
                    h || Wh(n);
                else if (h) {
                    var v = null;
                    if (o && o.hasAttribute("formAction")) {
                        if (i = o,
                        h = o[at] || null)
                            v = h.formAction;
                        else if (eo(i) !== null)
                            continue
                    } else
                        v = h.action;
                    typeof v == "function" ? n[l + 1] = v : (n.splice(l, 3),
                    l -= 3),
                    Wh(n)
                }
            }
    }
    function Ih() {
        function e(o) {
            o.canIntercept && o.info === "react-transition" && o.intercept({
                handler: function() {
                    return new Promise(function(h) {
                        return i = h
                    }
                    )
                },
                focusReset: "manual",
                scroll: "manual"
            })
        }
        function t() {
            i !== null && (i(),
            i = null),
            l || setTimeout(n, 20)
        }
        function n() {
            if (!l && !navigation.transition) {
                var o = navigation.currentEntry;
                o && o.url != null && navigation.navigate(o.url, {
                    state: o.getState(),
                    info: "react-transition",
                    history: "replace"
                })
            }
        }
        if (typeof navigation == "object") {
            var l = !1
              , i = null;
            return navigation.addEventListener("navigate", e),
            navigation.addEventListener("navigatesuccess", t),
            navigation.addEventListener("navigateerror", t),
            setTimeout(n, 100),
            function() {
                l = !0,
                navigation.removeEventListener("navigate", e),
                navigation.removeEventListener("navigatesuccess", t),
                navigation.removeEventListener("navigateerror", t),
                i !== null && (i(),
                i = null)
            }
        }
    }
    function no(e) {
        this._internalRoot = e
    }
    vs.prototype.render = no.prototype.render = function(e) {
        var t = this._internalRoot;
        if (t === null)
            throw Error(u(409));
        var n = t.current
          , l = bt();
        kh(n, l, e, t, null, null)
    }
    ,
    vs.prototype.unmount = no.prototype.unmount = function() {
        var e = this._internalRoot;
        if (e !== null) {
            this._internalRoot = null;
            var t = e.containerInfo;
            kh(e.current, 2, null, e, null, null),
            Ii(),
            t[nl] = null
        }
    }
    ;
    function vs(e) {
        this._internalRoot = e
    }
    vs.prototype.unstable_scheduleHydration = function(e) {
        if (e) {
            var t = rc();
            e = {
                blockedOn: null,
                target: e,
                priority: t
            };
            for (var n = 0; n < Dn.length && t !== 0 && t < Dn[n].priority; n++)
                ;
            Dn.splice(n, 0, e),
            n === 0 && $h(e)
        }
    }
    ;
    var Ph = a.version;
    if (Ph !== "19.2.4")
        throw Error(u(527, Ph, "19.2.4"));
    Q.findDOMNode = function(e) {
        var t = e._reactInternals;
        if (t === void 0)
            throw typeof e.render == "function" ? Error(u(188)) : (e = Object.keys(e).join(","),
            Error(u(268, e)));
        return e = p(t),
        e = e !== null ? b(e) : null,
        e = e === null ? null : e.stateNode,
        e
    }
    ;
    var zy = {
        bundleType: 0,
        version: "19.2.4",
        rendererPackageName: "react-dom",
        currentDispatcherRef: D,
        reconcilerVersion: "19.2.4"
    };
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < "u") {
        var xs = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (!xs.isDisabled && xs.supportsFiber)
            try {
                Jl = xs.inject(zy),
                dt = xs
            } catch {}
    }
    return Qa.createRoot = function(e, t) {
        if (!c(e))
            throw Error(u(299));
        var n = !1
          , l = ""
          , i = sd
          , o = rd
          , h = ud;
        return t != null && (t.unstable_strictMode === !0 && (n = !0),
        t.identifierPrefix !== void 0 && (l = t.identifierPrefix),
        t.onUncaughtError !== void 0 && (i = t.onUncaughtError),
        t.onCaughtError !== void 0 && (o = t.onCaughtError),
        t.onRecoverableError !== void 0 && (h = t.onRecoverableError)),
        t = Yh(e, 1, !1, null, null, n, l, null, i, o, h, Ih),
        e[nl] = t.current,
        Hu(e),
        new no(t)
    }
    ,
    Qa.hydrateRoot = function(e, t, n) {
        if (!c(e))
            throw Error(u(299));
        var l = !1
          , i = ""
          , o = sd
          , h = rd
          , v = ud
          , C = null;
        return n != null && (n.unstable_strictMode === !0 && (l = !0),
        n.identifierPrefix !== void 0 && (i = n.identifierPrefix),
        n.onUncaughtError !== void 0 && (o = n.onUncaughtError),
        n.onCaughtError !== void 0 && (h = n.onCaughtError),
        n.onRecoverableError !== void 0 && (v = n.onRecoverableError),
        n.formState !== void 0 && (C = n.formState)),
        t = Yh(e, 1, !0, t, n ?? null, l, i, C, o, h, v, Ih),
        t.context = Vh(null),
        n = t.current,
        l = bt(),
        l = Ks(l),
        i = bn(l),
        i.callback = null,
        Sn(n, i, l),
        n = l,
        t.current.lanes = n,
        Fl(t, n),
        qt(t),
        e[nl] = t.current,
        Hu(e),
        new vs(t)
    }
    ,
    Qa.version = "19.2.4",
    Qa
}
var ag;
function Qx() {
    if (ag)
        return wo.exports;
    ag = 1;
    function s() {
        if (!(typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > "u" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != "function"))
            try {
                __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(s)
            } catch (a) {
                console.error(a)
            }
    }
    return s(),
    wo.exports = kx(),
    wo.exports
}
var Xx = Qx();
var ig = "popstate";
function sg(s) {
    return typeof s == "object" && s != null && "pathname"in s && "search"in s && "hash"in s && "state"in s && "key"in s
}
function Kx(s={}) {
    function a(u, c) {
        let f = c.state?.masked
          , {pathname: d, search: m, hash: g} = f || u.location;
        return zo("", {
            pathname: d,
            search: m,
            hash: g
        }, c.state && c.state.usr || null, c.state && c.state.key || "default", f ? {
            pathname: u.location.pathname,
            search: u.location.search,
            hash: u.location.hash
        } : void 0)
    }
    function r(u, c) {
        return typeof c == "string" ? c : Ia(c)
    }
    return Jx(a, r, null, s)
}
function Xe(s, a) {
    if (s === !1 || s === null || typeof s > "u")
        throw new Error(a)
}
function kt(s, a) {
    if (!s) {
        typeof console < "u" && console.warn(a);
        try {
            throw new Error(a)
        } catch {}
    }
}
function Zx() {
    return Math.random().toString(36).substring(2, 10)
}
function rg(s, a) {
    return {
        usr: s.state,
        key: s.key,
        idx: a,
        masked: s.unstable_mask ? {
            pathname: s.pathname,
            search: s.search,
            hash: s.hash
        } : void 0
    }
}
function zo(s, a, r=null, u, c) {
    return {
        pathname: typeof s == "string" ? s : s.pathname,
        search: "",
        hash: "",
        ...typeof a == "string" ? Pa(a) : a,
        state: r,
        key: a && a.key || u || Zx(),
        unstable_mask: c
    }
}
function Ia({pathname: s="/", search: a="", hash: r=""}) {
    return a && a !== "?" && (s += a.charAt(0) === "?" ? a : "?" + a),
    r && r !== "#" && (s += r.charAt(0) === "#" ? r : "#" + r),
    s
}
function Pa(s) {
    let a = {};
    if (s) {
        let r = s.indexOf("#");
        r >= 0 && (a.hash = s.substring(r),
        s = s.substring(0, r));
        let u = s.indexOf("?");
        u >= 0 && (a.search = s.substring(u),
        s = s.substring(0, u)),
        s && (a.pathname = s)
    }
    return a
}
function Jx(s, a, r, u={}) {
    let {window: c=document.defaultView, v5Compat: f=!1} = u
      , d = c.history
      , m = "POP"
      , g = null
      , p = b();
    p == null && (p = 0,
    d.replaceState({
        ...d.state,
        idx: p
    }, ""));
    function b() {
        return (d.state || {
            idx: null
        }).idx
    }
    function x() {
        m = "POP";
        let _ = b()
          , L = _ == null ? null : _ - p;
        p = _,
        g && g({
            action: m,
            location: j.location,
            delta: L
        })
    }
    function E(_, L) {
        m = "PUSH";
        let G = sg(_) ? _ : zo(j.location, _, L);
        p = b() + 1;
        let V = rg(G, p)
          , J = j.createHref(G.unstable_mask || G);
        try {
            d.pushState(V, "", J)
        } catch (W) {
            if (W instanceof DOMException && W.name === "DataCloneError")
                throw W;
            c.location.assign(J)
        }
        f && g && g({
            action: m,
            location: j.location,
            delta: 1
        })
    }
    function S(_, L) {
        m = "REPLACE";
        let G = sg(_) ? _ : zo(j.location, _, L);
        p = b();
        let V = rg(G, p)
          , J = j.createHref(G.unstable_mask || G);
        d.replaceState(V, "", J),
        f && g && g({
            action: m,
            location: j.location,
            delta: 0
        })
    }
    function w(_) {
        return $x(_)
    }
    let j = {
        get action() {
            return m
        },
        get location() {
            return s(c, d)
        },
        listen(_) {
            if (g)
                throw new Error("A history only accepts one active listener");
            return c.addEventListener(ig, x),
            g = _,
            () => {
                c.removeEventListener(ig, x),
                g = null
            }
        },
        createHref(_) {
            return a(c, _)
        },
        createURL: w,
        encodeLocation(_) {
            let L = w(_);
            return {
                pathname: L.pathname,
                search: L.search,
                hash: L.hash
            }
        },
        push: E,
        replace: S,
        go(_) {
            return d.go(_)
        }
    };
    return j
}
function $x(s, a=!1) {
    let r = "http://localhost";
    typeof window < "u" && (r = window.location.origin !== "null" ? window.location.origin : window.location.href),
    Xe(r, "No window.location.(origin|href) available to create URL");
    let u = typeof s == "string" ? s : Ia(s);
    return u = u.replace(/ $/, "%20"),
    !a && u.startsWith("//") && (u = r + u),
    new URL(u,r)
}
function Qg(s, a, r="/") {
    return Fx(s, a, r, !1)
}
function Fx(s, a, r, u) {
    let c = typeof a == "string" ? Pa(a) : a
      , f = on(c.pathname || "/", r);
    if (f == null)
        return null;
    let d = Xg(s);
    Wx(d);
    let m = null;
    for (let g = 0; m == null && g < d.length; ++g) {
        let p = ub(f);
        m = sb(d[g], p, u)
    }
    return m
}
function Xg(s, a=[], r=[], u="", c=!1) {
    let f = (d, m, g=c, p) => {
        let b = {
            relativePath: p === void 0 ? d.path || "" : p,
            caseSensitive: d.caseSensitive === !0,
            childrenIndex: m,
            route: d
        };
        if (b.relativePath.startsWith("/")) {
            if (!b.relativePath.startsWith(u) && g)
                return;
            Xe(b.relativePath.startsWith(u), `Absolute route path "${b.relativePath}" nested under path "${u}" is not valid. An absolute child route path must start with the combined path of all its parent routes.`),
            b.relativePath = b.relativePath.slice(u.length)
        }
        let x = Vt([u, b.relativePath])
          , E = r.concat(b);
        d.children && d.children.length > 0 && (Xe(d.index !== !0, `Index routes must not have child routes. Please remove all child routes from route path "${x}".`),
        Xg(d.children, a, E, x, g)),
        !(d.path == null && !d.index) && a.push({
            path: x,
            score: ab(x, d.index),
            routesMeta: E
        })
    }
    ;
    return s.forEach( (d, m) => {
        if (d.path === "" || !d.path?.includes("?"))
            f(d, m);
        else
            for (let g of Kg(d.path))
                f(d, m, !0, g)
    }
    ),
    a
}
function Kg(s) {
    let a = s.split("/");
    if (a.length === 0)
        return [];
    let[r,...u] = a
      , c = r.endsWith("?")
      , f = r.replace(/\?$/, "");
    if (u.length === 0)
        return c ? [f, ""] : [f];
    let d = Kg(u.join("/"))
      , m = [];
    return m.push(...d.map(g => g === "" ? f : [f, g].join("/"))),
    c && m.push(...d),
    m.map(g => s.startsWith("/") && g === "" ? "/" : g)
}
function Wx(s) {
    s.sort( (a, r) => a.score !== r.score ? r.score - a.score : ib(a.routesMeta.map(u => u.childrenIndex), r.routesMeta.map(u => u.childrenIndex)))
}
var Ix = /^:[\w-]+$/
  , Px = 3
  , eb = 2
  , tb = 1
  , nb = 10
  , lb = -2
  , ug = s => s === "*";
function ab(s, a) {
    let r = s.split("/")
      , u = r.length;
    return r.some(ug) && (u += lb),
    a && (u += eb),
    r.filter(c => !ug(c)).reduce( (c, f) => c + (Ix.test(f) ? Px : f === "" ? tb : nb), u)
}
function ib(s, a) {
    return s.length === a.length && s.slice(0, -1).every( (u, c) => u === a[c]) ? s[s.length - 1] - a[a.length - 1] : 0
}
function sb(s, a, r=!1) {
    let {routesMeta: u} = s
      , c = {}
      , f = "/"
      , d = [];
    for (let m = 0; m < u.length; ++m) {
        let g = u[m]
          , p = m === u.length - 1
          , b = f === "/" ? a : a.slice(f.length) || "/"
          , x = Ls({
            path: g.relativePath,
            caseSensitive: g.caseSensitive,
            end: p
        }, b)
          , E = g.route;
        if (!x && p && r && !u[u.length - 1].route.index && (x = Ls({
            path: g.relativePath,
            caseSensitive: g.caseSensitive,
            end: !1
        }, b)),
        !x)
            return null;
        Object.assign(c, x.params),
        d.push({
            params: c,
            pathname: Vt([f, x.pathname]),
            pathnameBase: db(Vt([f, x.pathnameBase])),
            route: E
        }),
        x.pathnameBase !== "/" && (f = Vt([f, x.pathnameBase]))
    }
    return d
}
function Ls(s, a) {
    typeof s == "string" && (s = {
        path: s,
        caseSensitive: !1,
        end: !0
    });
    let[r,u] = rb(s.path, s.caseSensitive, s.end)
      , c = a.match(r);
    if (!c)
        return null;
    let f = c[0]
      , d = f.replace(/(.)\/+$/, "$1")
      , m = c.slice(1);
    return {
        params: u.reduce( (p, {paramName: b, isOptional: x}, E) => {
            if (b === "*") {
                let w = m[E] || "";
                d = f.slice(0, f.length - w.length).replace(/(.)\/+$/, "$1")
            }
            const S = m[E];
            return x && !S ? p[b] = void 0 : p[b] = (S || "").replace(/%2F/g, "/"),
            p
        }
        , {}),
        pathname: f,
        pathnameBase: d,
        pattern: s
    }
}
function rb(s, a=!1, r=!0) {
    kt(s === "*" || !s.endsWith("*") || s.endsWith("/*"), `Route path "${s}" will be treated as if it were "${s.replace(/\*$/, "/*")}" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to "${s.replace(/\*$/, "/*")}".`);
    let u = []
      , c = "^" + s.replace(/\/*\*?$/, "").replace(/^\/*/, "/").replace(/[\\.*+^${}|()[\]]/g, "\\$&").replace(/\/:([\w-]+)(\?)?/g, (d, m, g, p, b) => {
        if (u.push({
            paramName: m,
            isOptional: g != null
        }),
        g) {
            let x = b.charAt(p + d.length);
            return x && x !== "/" ? "/([^\\/]*)" : "(?:/([^\\/]*))?"
        }
        return "/([^\\/]+)"
    }
    ).replace(/\/([\w-]+)\?(\/|$)/g, "(/$1)?$2");
    return s.endsWith("*") ? (u.push({
        paramName: "*"
    }),
    c += s === "*" || s === "/*" ? "(.*)$" : "(?:\\/(.+)|\\/*)$") : r ? c += "\\/*$" : s !== "" && s !== "/" && (c += "(?:(?=\\/|$))"),
    [new RegExp(c,a ? void 0 : "i"), u]
}
function ub(s) {
    try {
        return s.split("/").map(a => decodeURIComponent(a).replace(/\//g, "%2F")).join("/")
    } catch (a) {
        return kt(!1, `The URL path "${s}" could not be decoded because it is a malformed URL segment. This is probably due to a bad percent encoding (${a}).`),
        s
    }
}
function on(s, a) {
    if (a === "/")
        return s;
    if (!s.toLowerCase().startsWith(a.toLowerCase()))
        return null;
    let r = a.endsWith("/") ? a.length - 1 : a.length
      , u = s.charAt(r);
    return u && u !== "/" ? null : s.slice(r) || "/"
}
var ob = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;
function cb(s, a="/") {
    let {pathname: r, search: u="", hash: c=""} = typeof s == "string" ? Pa(s) : s, f;
    return r ? (r = r.replace(/\/\/+/g, "/"),
    r.startsWith("/") ? f = og(r.substring(1), "/") : f = og(r, a)) : f = a,
    {
        pathname: f,
        search: hb(u),
        hash: mb(c)
    }
}
function og(s, a) {
    let r = a.replace(/\/+$/, "").split("/");
    return s.split("/").forEach(c => {
        c === ".." ? r.length > 1 && r.pop() : c !== "." && r.push(c)
    }
    ),
    r.length > 1 ? r.join("/") : "/"
}
function To(s, a, r, u) {
    return `Cannot include a '${s}' character in a manually specified \`to.${a}\` field [${JSON.stringify(u)}].  Please separate it out to the \`to.${r}\` field. Alternatively you may provide the full path as a string in <Link to="..."> and the router will parse it for you.`
}
function fb(s) {
    return s.filter( (a, r) => r === 0 || a.route.path && a.route.path.length > 0)
}
function Zg(s) {
    let a = fb(s);
    return a.map( (r, u) => u === a.length - 1 ? r.pathname : r.pathnameBase)
}
function Ko(s, a, r, u=!1) {
    let c;
    typeof s == "string" ? c = Pa(s) : (c = {
        ...s
    },
    Xe(!c.pathname || !c.pathname.includes("?"), To("?", "pathname", "search", c)),
    Xe(!c.pathname || !c.pathname.includes("#"), To("#", "pathname", "hash", c)),
    Xe(!c.search || !c.search.includes("#"), To("#", "search", "hash", c)));
    let f = s === "" || c.pathname === "", d = f ? "/" : c.pathname, m;
    if (d == null)
        m = r;
    else {
        let x = a.length - 1;
        if (!u && d.startsWith("..")) {
            let E = d.split("/");
            for (; E[0] === ".."; )
                E.shift(),
                x -= 1;
            c.pathname = E.join("/")
        }
        m = x >= 0 ? a[x] : "/"
    }
    let g = cb(c, m)
      , p = d && d !== "/" && d.endsWith("/")
      , b = (f || d === ".") && r.endsWith("/");
    return !g.pathname.endsWith("/") && (p || b) && (g.pathname += "/"),
    g
}
var Vt = s => s.join("/").replace(/\/\/+/g, "/")
  , db = s => s.replace(/\/+$/, "").replace(/^\/*/, "/")
  , hb = s => !s || s === "?" ? "" : s.startsWith("?") ? s : "?" + s
  , mb = s => !s || s === "#" ? "" : s.startsWith("#") ? s : "#" + s
  , gb = class {
    constructor(s, a, r, u=!1) {
        this.status = s,
        this.statusText = a || "",
        this.internal = u,
        r instanceof Error ? (this.data = r.toString(),
        this.error = r) : this.data = r
    }
}
;
function pb(s) {
    return s != null && typeof s.status == "number" && typeof s.statusText == "string" && typeof s.internal == "boolean" && "data"in s
}
function yb(s) {
    return s.map(a => a.route.path).filter(Boolean).join("/").replace(/\/\/*/g, "/") || "/"
}
var Jg = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u";
function $g(s, a) {
    let r = s;
    if (typeof r != "string" || !ob.test(r))
        return {
            absoluteURL: void 0,
            isExternal: !1,
            to: r
        };
    let u = r
      , c = !1;
    if (Jg)
        try {
            let f = new URL(window.location.href)
              , d = r.startsWith("//") ? new URL(f.protocol + r) : new URL(r)
              , m = on(d.pathname, a);
            d.origin === f.origin && m != null ? r = m + d.search + d.hash : c = !0
        } catch {
            kt(!1, `<Link to="${r}"> contains an invalid URL which will probably break when clicked - please update to a valid URL path.`)
        }
    return {
        absoluteURL: u,
        isExternal: c,
        to: r
    }
}
Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
var Fg = ["POST", "PUT", "PATCH", "DELETE"];
new Set(Fg);
var vb = ["GET", ...Fg];
new Set(vb);
var Kl = H.createContext(null);
Kl.displayName = "DataRouter";
var Us = H.createContext(null);
Us.displayName = "DataRouterState";
var xb = H.createContext(!1)
  , Wg = H.createContext({
    isTransitioning: !1
});
Wg.displayName = "ViewTransition";
var bb = H.createContext(new Map);
bb.displayName = "Fetchers";
var Sb = H.createContext(null);
Sb.displayName = "Await";
var Rt = H.createContext(null);
Rt.displayName = "Navigation";
var Hs = H.createContext(null);
Hs.displayName = "Location";
var cn = H.createContext({
    outlet: null,
    matches: [],
    isDataRoute: !1
});
cn.displayName = "Route";
var Zo = H.createContext(null);
Zo.displayName = "RouteError";
var Ig = "REACT_ROUTER_ERROR"
  , Eb = "REDIRECT"
  , wb = "ROUTE_ERROR_RESPONSE";
function _b(s) {
    if (s.startsWith(`${Ig}:${Eb}:{`))
        try {
            let a = JSON.parse(s.slice(28));
            if (typeof a == "object" && a && typeof a.status == "number" && typeof a.statusText == "string" && typeof a.location == "string" && typeof a.reloadDocument == "boolean" && typeof a.replace == "boolean")
                return a
        } catch {}
}
function Cb(s) {
    if (s.startsWith(`${Ig}:${wb}:{`))
        try {
            let a = JSON.parse(s.slice(40));
            if (typeof a == "object" && a && typeof a.status == "number" && typeof a.statusText == "string")
                return new gb(a.status,a.statusText,a.data)
        } catch {}
}
function Nb(s, {relative: a}={}) {
    Xe(ei(), "useHref() may be used only in the context of a <Router> component.");
    let {basename: r, navigator: u} = H.useContext(Rt)
      , {hash: c, pathname: f, search: d} = ti(s, {
        relative: a
    })
      , m = f;
    return r !== "/" && (m = f === "/" ? r : Vt([r, f])),
    u.createHref({
        pathname: m,
        search: d,
        hash: c
    })
}
function ei() {
    return H.useContext(Hs) != null
}
function fn() {
    return Xe(ei(), "useLocation() may be used only in the context of a <Router> component."),
    H.useContext(Hs).location
}
var Pg = "You should call navigate() in a React.useEffect(), not when your component is first rendered.";
function ep(s) {
    H.useContext(Rt).static || H.useLayoutEffect(s)
}
function tp() {
    let {isDataRoute: s} = H.useContext(cn);
    return s ? qb() : Tb()
}
function Tb() {
    Xe(ei(), "useNavigate() may be used only in the context of a <Router> component.");
    let s = H.useContext(Kl)
      , {basename: a, navigator: r} = H.useContext(Rt)
      , {matches: u} = H.useContext(cn)
      , {pathname: c} = fn()
      , f = JSON.stringify(Zg(u))
      , d = H.useRef(!1);
    return ep( () => {
        d.current = !0
    }
    ),
    H.useCallback( (g, p={}) => {
        if (kt(d.current, Pg),
        !d.current)
            return;
        if (typeof g == "number") {
            r.go(g);
            return
        }
        let b = Ko(g, JSON.parse(f), c, p.relative === "path");
        s == null && a !== "/" && (b.pathname = b.pathname === "/" ? a : Vt([a, b.pathname])),
        (p.replace ? r.replace : r.push)(b, p.state, p)
    }
    , [a, r, f, c, s])
}
H.createContext(null);
function ti(s, {relative: a}={}) {
    let {matches: r} = H.useContext(cn)
      , {pathname: u} = fn()
      , c = JSON.stringify(Zg(r));
    return H.useMemo( () => Ko(s, JSON.parse(c), u, a === "path"), [s, c, u, a])
}
function jb(s, a) {
    return np(s)
}
function np(s, a, r) {
    Xe(ei(), "useRoutes() may be used only in the context of a <Router> component.");
    let {navigator: u} = H.useContext(Rt)
      , {matches: c} = H.useContext(cn)
      , f = c[c.length - 1]
      , d = f ? f.params : {}
      , m = f ? f.pathname : "/"
      , g = f ? f.pathnameBase : "/"
      , p = f && f.route;
    {
        let _ = p && p.path || "";
        ap(m, !p || _.endsWith("*") || _.endsWith("*?"), `You rendered descendant <Routes> (or called \`useRoutes()\`) at "${m}" (under <Route path="${_}">) but the parent route path has no trailing "*". This means if you navigate deeper, the parent won't match anymore and therefore the child routes will never render.

Please change the parent <Route path="${_}"> to <Route path="${_ === "/" ? "*" : `${_}/*`}">.`)
    }
    let b = fn(), x;
    x = b;
    let E = x.pathname || "/"
      , S = E;
    if (g !== "/") {
        let _ = g.replace(/^\//, "").split("/");
        S = "/" + E.replace(/^\//, "").split("/").slice(_.length).join("/")
    }
    let w = Qg(s, {
        pathname: S
    });
    return kt(p || w != null, `No routes matched location "${x.pathname}${x.search}${x.hash}" `),
    kt(w == null || w[w.length - 1].route.element !== void 0 || w[w.length - 1].route.Component !== void 0 || w[w.length - 1].route.lazy !== void 0, `Matched leaf route at location "${x.pathname}${x.search}${x.hash}" does not have an element or Component. This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`),
    Lb(w && w.map(_ => Object.assign({}, _, {
        params: Object.assign({}, d, _.params),
        pathname: Vt([g, u.encodeLocation ? u.encodeLocation(_.pathname.replace(/\?/g, "%3F").replace(/#/g, "%23")).pathname : _.pathname]),
        pathnameBase: _.pathnameBase === "/" ? g : Vt([g, u.encodeLocation ? u.encodeLocation(_.pathnameBase.replace(/\?/g, "%3F").replace(/#/g, "%23")).pathname : _.pathnameBase])
    })), c, r)
}
function Ob() {
    let s = Bb()
      , a = pb(s) ? `${s.status} ${s.statusText}` : s instanceof Error ? s.message : JSON.stringify(s)
      , r = s instanceof Error ? s.stack : null
      , u = "rgba(200,200,200, 0.5)"
      , c = {
        padding: "0.5rem",
        backgroundColor: u
    }
      , f = {
        padding: "2px 4px",
        backgroundColor: u
    }
      , d = null;
    return console.error("Error handled by React Router default ErrorBoundary:", s),
    d = H.createElement(H.Fragment, null, H.createElement("p", null, "💿 Hey developer 👋"), H.createElement("p", null, "You can provide a way better UX than this when your app throws errors by providing your own ", H.createElement("code", {
        style: f
    }, "ErrorBoundary"), " or", " ", H.createElement("code", {
        style: f
    }, "errorElement"), " prop on your route.")),
    H.createElement(H.Fragment, null, H.createElement("h2", null, "Unexpected Application Error!"), H.createElement("h3", {
        style: {
            fontStyle: "italic"
        }
    }, a), r ? H.createElement("pre", {
        style: c
    }, r) : null, d)
}
var Ab = H.createElement(Ob, null)
  , lp = class extends H.Component {
    constructor(s) {
        super(s),
        this.state = {
            location: s.location,
            revalidation: s.revalidation,
            error: s.error
        }
    }
    static getDerivedStateFromError(s) {
        return {
            error: s
        }
    }
    static getDerivedStateFromProps(s, a) {
        return a.location !== s.location || a.revalidation !== "idle" && s.revalidation === "idle" ? {
            error: s.error,
            location: s.location,
            revalidation: s.revalidation
        } : {
            error: s.error !== void 0 ? s.error : a.error,
            location: a.location,
            revalidation: s.revalidation || a.revalidation
        }
    }
    componentDidCatch(s, a) {
        this.props.onError ? this.props.onError(s, a) : console.error("React Router caught the following error during render", s)
    }
    render() {
        let s = this.state.error;
        if (this.context && typeof s == "object" && s && "digest"in s && typeof s.digest == "string") {
            const r = Cb(s.digest);
            r && (s = r)
        }
        let a = s !== void 0 ? H.createElement(cn.Provider, {
            value: this.props.routeContext
        }, H.createElement(Zo.Provider, {
            value: s,
            children: this.props.component
        })) : this.props.children;
        return this.context ? H.createElement(Rb, {
            error: s
        }, a) : a
    }
}
;
lp.contextType = xb;
var jo = new WeakMap;
function Rb({children: s, error: a}) {
    let {basename: r} = H.useContext(Rt);
    if (typeof a == "object" && a && "digest"in a && typeof a.digest == "string") {
        let u = _b(a.digest);
        if (u) {
            let c = jo.get(a);
            if (c)
                throw c;
            let f = $g(u.location, r);
            if (Jg && !jo.get(a))
                if (f.isExternal || u.reloadDocument)
                    window.location.href = f.absoluteURL || f.to;
                else {
                    const d = Promise.resolve().then( () => window.__reactRouterDataRouter.navigate(f.to, {
                        replace: u.replace
                    }));
                    throw jo.set(a, d),
                    d
                }
            return H.createElement("meta", {
                httpEquiv: "refresh",
                content: `0;url=${f.absoluteURL || f.to}`
            })
        }
    }
    return s
}
function Mb({routeContext: s, match: a, children: r}) {
    let u = H.useContext(Kl);
    return u && u.static && u.staticContext && (a.route.errorElement || a.route.ErrorBoundary) && (u.staticContext._deepestRenderedBoundaryId = a.route.id),
    H.createElement(cn.Provider, {
        value: s
    }, r)
}
function Lb(s, a=[], r) {
    let u = r?.state;
    if (s == null) {
        if (!u)
            return null;
        if (u.errors)
            s = u.matches;
        else if (a.length === 0 && !u.initialized && u.matches.length > 0)
            s = u.matches;
        else
            return null
    }
    let c = s
      , f = u?.errors;
    if (f != null) {
        let b = c.findIndex(x => x.route.id && f?.[x.route.id] !== void 0);
        Xe(b >= 0, `Could not find a matching route for errors on route IDs: ${Object.keys(f).join(",")}`),
        c = c.slice(0, Math.min(c.length, b + 1))
    }
    let d = !1
      , m = -1;
    if (r && u) {
        d = u.renderFallback;
        for (let b = 0; b < c.length; b++) {
            let x = c[b];
            if ((x.route.HydrateFallback || x.route.hydrateFallbackElement) && (m = b),
            x.route.id) {
                let {loaderData: E, errors: S} = u
                  , w = x.route.loader && !E.hasOwnProperty(x.route.id) && (!S || S[x.route.id] === void 0);
                if (x.route.lazy || w) {
                    r.isStatic && (d = !0),
                    m >= 0 ? c = c.slice(0, m + 1) : c = [c[0]];
                    break
                }
            }
        }
    }
    let g = r?.onError
      , p = u && g ? (b, x) => {
        g(b, {
            location: u.location,
            params: u.matches?.[0]?.params ?? {},
            unstable_pattern: yb(u.matches),
            errorInfo: x
        })
    }
    : void 0;
    return c.reduceRight( (b, x, E) => {
        let S, w = !1, j = null, _ = null;
        u && (S = f && x.route.id ? f[x.route.id] : void 0,
        j = x.route.errorElement || Ab,
        d && (m < 0 && E === 0 ? (ap("route-fallback", !1, "No `HydrateFallback` element provided to render during initial hydration"),
        w = !0,
        _ = null) : m === E && (w = !0,
        _ = x.route.hydrateFallbackElement || null)));
        let L = a.concat(c.slice(0, E + 1))
          , G = () => {
            let V;
            return S ? V = j : w ? V = _ : x.route.Component ? V = H.createElement(x.route.Component, null) : x.route.element ? V = x.route.element : V = b,
            H.createElement(Mb, {
                match: x,
                routeContext: {
                    outlet: b,
                    matches: L,
                    isDataRoute: u != null
                },
                children: V
            })
        }
        ;
        return u && (x.route.ErrorBoundary || x.route.errorElement || E === 0) ? H.createElement(lp, {
            location: u.location,
            revalidation: u.revalidation,
            component: j,
            error: S,
            children: G(),
            routeContext: {
                outlet: null,
                matches: L,
                isDataRoute: !0
            },
            onError: p
        }) : G()
    }
    , null)
}
function Jo(s) {
    return `${s} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`
}
function zb(s) {
    let a = H.useContext(Kl);
    return Xe(a, Jo(s)),
    a
}
function Db(s) {
    let a = H.useContext(Us);
    return Xe(a, Jo(s)),
    a
}
function Ub(s) {
    let a = H.useContext(cn);
    return Xe(a, Jo(s)),
    a
}
function $o(s) {
    let a = Ub(s)
      , r = a.matches[a.matches.length - 1];
    return Xe(r.route.id, `${s} can only be used on routes that contain a unique "id"`),
    r.route.id
}
function Hb() {
    return $o("useRouteId")
}
function Bb() {
    let s = H.useContext(Zo)
      , a = Db("useRouteError")
      , r = $o("useRouteError");
    return s !== void 0 ? s : a.errors?.[r]
}
function qb() {
    let {router: s} = zb("useNavigate")
      , a = $o("useNavigate")
      , r = H.useRef(!1);
    return ep( () => {
        r.current = !0
    }
    ),
    H.useCallback(async (c, f={}) => {
        kt(r.current, Pg),
        r.current && (typeof c == "number" ? await s.navigate(c) : await s.navigate(c, {
            fromRouteId: a,
            ...f
        }))
    }
    , [s, a])
}
var cg = {};
function ap(s, a, r) {
    !a && !cg[s] && (cg[s] = !0,
    kt(!1, r))
}
H.memo(Gb);
function Gb({routes: s, future: a, state: r, isStatic: u, onError: c}) {
    return np(s, void 0, {
        state: r,
        isStatic: u,
        onError: c
    })
}
function Yb({basename: s="/", children: a=null, location: r, navigationType: u="POP", navigator: c, static: f=!1, unstable_useTransitions: d}) {
    Xe(!ei(), "You cannot render a <Router> inside another <Router>. You should never have more than one in your app.");
    let m = s.replace(/^\/*/, "/")
      , g = H.useMemo( () => ({
        basename: m,
        navigator: c,
        static: f,
        unstable_useTransitions: d,
        future: {}
    }), [m, c, f, d]);
    typeof r == "string" && (r = Pa(r));
    let {pathname: p="/", search: b="", hash: x="", state: E=null, key: S="default", unstable_mask: w} = r
      , j = H.useMemo( () => {
        let _ = on(p, m);
        return _ == null ? null : {
            location: {
                pathname: _,
                search: b,
                hash: x,
                state: E,
                key: S,
                unstable_mask: w
            },
            navigationType: u
        }
    }
    , [m, p, b, x, E, S, u, w]);
    return kt(j != null, `<Router basename="${m}"> is not able to match the URL "${p}${b}${x}" because it does not start with the basename, so the <Router> won't render anything.`),
    j == null ? null : H.createElement(Rt.Provider, {
        value: g
    }, H.createElement(Hs.Provider, {
        children: a,
        value: j
    }))
}
var Ts = "get"
  , js = "application/x-www-form-urlencoded";
function Bs(s) {
    return typeof HTMLElement < "u" && s instanceof HTMLElement
}
function Vb(s) {
    return Bs(s) && s.tagName.toLowerCase() === "button"
}
function kb(s) {
    return Bs(s) && s.tagName.toLowerCase() === "form"
}
function Qb(s) {
    return Bs(s) && s.tagName.toLowerCase() === "input"
}
function Xb(s) {
    return !!(s.metaKey || s.altKey || s.ctrlKey || s.shiftKey)
}
function Kb(s, a) {
    return s.button === 0 && (!a || a === "_self") && !Xb(s)
}
var Ns = null;
function Zb() {
    if (Ns === null)
        try {
            new FormData(document.createElement("form"),0),
            Ns = !1
        } catch {
            Ns = !0
        }
    return Ns
}
var Jb = new Set(["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"]);
function Oo(s) {
    return s != null && !Jb.has(s) ? (kt(!1, `"${s}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${js}"`),
    null) : s
}
function $b(s, a) {
    let r, u, c, f, d;
    if (kb(s)) {
        let m = s.getAttribute("action");
        u = m ? on(m, a) : null,
        r = s.getAttribute("method") || Ts,
        c = Oo(s.getAttribute("enctype")) || js,
        f = new FormData(s)
    } else if (Vb(s) || Qb(s) && (s.type === "submit" || s.type === "image")) {
        let m = s.form;
        if (m == null)
            throw new Error('Cannot submit a <button> or <input type="submit"> without a <form>');
        let g = s.getAttribute("formaction") || m.getAttribute("action");
        if (u = g ? on(g, a) : null,
        r = s.getAttribute("formmethod") || m.getAttribute("method") || Ts,
        c = Oo(s.getAttribute("formenctype")) || Oo(m.getAttribute("enctype")) || js,
        f = new FormData(m,s),
        !Zb()) {
            let {name: p, type: b, value: x} = s;
            if (b === "image") {
                let E = p ? `${p}.` : "";
                f.append(`${E}x`, "0"),
                f.append(`${E}y`, "0")
            } else
                p && f.append(p, x)
        }
    } else {
        if (Bs(s))
            throw new Error('Cannot submit element that is not <form>, <button>, or <input type="submit|image">');
        r = Ts,
        u = null,
        c = js,
        d = s
    }
    return f && c === "text/plain" && (d = f,
    f = void 0),
    {
        action: u,
        method: r.toLowerCase(),
        encType: c,
        formData: f,
        body: d
    }
}
Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
function Fo(s, a) {
    if (s === !1 || s === null || typeof s > "u")
        throw new Error(a)
}
function Fb(s, a, r, u) {
    let c = typeof s == "string" ? new URL(s,typeof window > "u" ? "server://singlefetch/" : window.location.origin) : s;
    return r ? c.pathname.endsWith("/") ? c.pathname = `${c.pathname}_.${u}` : c.pathname = `${c.pathname}.${u}` : c.pathname === "/" ? c.pathname = `_root.${u}` : a && on(c.pathname, a) === "/" ? c.pathname = `${a.replace(/\/$/, "")}/_root.${u}` : c.pathname = `${c.pathname.replace(/\/$/, "")}.${u}`,
    c
}
async function Wb(s, a) {
    if (s.id in a)
        return a[s.id];
    try {
        let r = await import(s.module);
        return a[s.id] = r,
        r
    } catch (r) {
        return console.error(`Error loading route module \`${s.module}\`, reloading page...`),
        console.error(r),
        window.__reactRouterContext && window.__reactRouterContext.isSpaMode,
        window.location.reload(),
        new Promise( () => {}
        )
    }
}
function Ib(s) {
    return s == null ? !1 : s.href == null ? s.rel === "preload" && typeof s.imageSrcSet == "string" && typeof s.imageSizes == "string" : typeof s.rel == "string" && typeof s.href == "string"
}
async function Pb(s, a, r) {
    let u = await Promise.all(s.map(async c => {
        let f = a.routes[c.route.id];
        if (f) {
            let d = await Wb(f, r);
            return d.links ? d.links() : []
        }
        return []
    }
    ));
    return l1(u.flat(1).filter(Ib).filter(c => c.rel === "stylesheet" || c.rel === "preload").map(c => c.rel === "stylesheet" ? {
        ...c,
        rel: "prefetch",
        as: "style"
    } : {
        ...c,
        rel: "prefetch"
    }))
}
function fg(s, a, r, u, c, f) {
    let d = (g, p) => r[p] ? g.route.id !== r[p].route.id : !0
      , m = (g, p) => r[p].pathname !== g.pathname || r[p].route.path?.endsWith("*") && r[p].params["*"] !== g.params["*"];
    return f === "assets" ? a.filter( (g, p) => d(g, p) || m(g, p)) : f === "data" ? a.filter( (g, p) => {
        let b = u.routes[g.route.id];
        if (!b || !b.hasLoader)
            return !1;
        if (d(g, p) || m(g, p))
            return !0;
        if (g.route.shouldRevalidate) {
            let x = g.route.shouldRevalidate({
                currentUrl: new URL(c.pathname + c.search + c.hash,window.origin),
                currentParams: r[0]?.params || {},
                nextUrl: new URL(s,window.origin),
                nextParams: g.params,
                defaultShouldRevalidate: !0
            });
            if (typeof x == "boolean")
                return x
        }
        return !0
    }
    ) : []
}
function e1(s, a, {includeHydrateFallback: r}={}) {
    return t1(s.map(u => {
        let c = a.routes[u.route.id];
        if (!c)
            return [];
        let f = [c.module];
        return c.clientActionModule && (f = f.concat(c.clientActionModule)),
        c.clientLoaderModule && (f = f.concat(c.clientLoaderModule)),
        r && c.hydrateFallbackModule && (f = f.concat(c.hydrateFallbackModule)),
        c.imports && (f = f.concat(c.imports)),
        f
    }
    ).flat(1))
}
function t1(s) {
    return [...new Set(s)]
}
function n1(s) {
    let a = {}
      , r = Object.keys(s).sort();
    for (let u of r)
        a[u] = s[u];
    return a
}
function l1(s, a) {
    let r = new Set;
    return new Set(a),
    s.reduce( (u, c) => {
        let f = JSON.stringify(n1(c));
        return r.has(f) || (r.add(f),
        u.push({
            key: f,
            link: c
        })),
        u
    }
    , [])
}
function ip() {
    let s = H.useContext(Kl);
    return Fo(s, "You must render this element inside a <DataRouterContext.Provider> element"),
    s
}
function a1() {
    let s = H.useContext(Us);
    return Fo(s, "You must render this element inside a <DataRouterStateContext.Provider> element"),
    s
}
var Wo = H.createContext(void 0);
Wo.displayName = "FrameworkContext";
function sp() {
    let s = H.useContext(Wo);
    return Fo(s, "You must render this element inside a <HydratedRouter> element"),
    s
}
function i1(s, a) {
    let r = H.useContext(Wo)
      , [u,c] = H.useState(!1)
      , [f,d] = H.useState(!1)
      , {onFocus: m, onBlur: g, onMouseEnter: p, onMouseLeave: b, onTouchStart: x} = a
      , E = H.useRef(null);
    H.useEffect( () => {
        if (s === "render" && d(!0),
        s === "viewport") {
            let j = L => {
                L.forEach(G => {
                    d(G.isIntersecting)
                }
                )
            }
              , _ = new IntersectionObserver(j,{
                threshold: .5
            });
            return E.current && _.observe(E.current),
            () => {
                _.disconnect()
            }
        }
    }
    , [s]),
    H.useEffect( () => {
        if (u) {
            let j = setTimeout( () => {
                d(!0)
            }
            , 100);
            return () => {
                clearTimeout(j)
            }
        }
    }
    , [u]);
    let S = () => {
        c(!0)
    }
      , w = () => {
        c(!1),
        d(!1)
    }
    ;
    return r ? s !== "intent" ? [f, E, {}] : [f, E, {
        onFocus: Xa(m, S),
        onBlur: Xa(g, w),
        onMouseEnter: Xa(p, S),
        onMouseLeave: Xa(b, w),
        onTouchStart: Xa(x, S)
    }] : [!1, E, {}]
}
function Xa(s, a) {
    return r => {
        s && s(r),
        r.defaultPrevented || a(r)
    }
}
function s1({page: s, ...a}) {
    let {router: r} = ip()
      , u = H.useMemo( () => Qg(r.routes, s, r.basename), [r.routes, s, r.basename]);
    return u ? H.createElement(u1, {
        page: s,
        matches: u,
        ...a
    }) : null
}
function r1(s) {
    let {manifest: a, routeModules: r} = sp()
      , [u,c] = H.useState([]);
    return H.useEffect( () => {
        let f = !1;
        return Pb(s, a, r).then(d => {
            f || c(d)
        }
        ),
        () => {
            f = !0
        }
    }
    , [s, a, r]),
    u
}
function u1({page: s, matches: a, ...r}) {
    let u = fn()
      , {future: c, manifest: f, routeModules: d} = sp()
      , {basename: m} = ip()
      , {loaderData: g, matches: p} = a1()
      , b = H.useMemo( () => fg(s, a, p, f, u, "data"), [s, a, p, f, u])
      , x = H.useMemo( () => fg(s, a, p, f, u, "assets"), [s, a, p, f, u])
      , E = H.useMemo( () => {
        if (s === u.pathname + u.search + u.hash)
            return [];
        let j = new Set
          , _ = !1;
        if (a.forEach(G => {
            let V = f.routes[G.route.id];
            !V || !V.hasLoader || (!b.some(J => J.route.id === G.route.id) && G.route.id in g && d[G.route.id]?.shouldRevalidate || V.hasClientLoader ? _ = !0 : j.add(G.route.id))
        }
        ),
        j.size === 0)
            return [];
        let L = Fb(s, m, c.unstable_trailingSlashAwareDataRequests, "data");
        return _ && j.size > 0 && L.searchParams.set("_routes", a.filter(G => j.has(G.route.id)).map(G => G.route.id).join(",")),
        [L.pathname + L.search]
    }
    , [m, c.unstable_trailingSlashAwareDataRequests, g, u, f, b, a, s, d])
      , S = H.useMemo( () => e1(x, f), [x, f])
      , w = r1(x);
    return H.createElement(H.Fragment, null, E.map(j => H.createElement("link", {
        key: j,
        rel: "prefetch",
        as: "fetch",
        href: j,
        ...r
    })), S.map(j => H.createElement("link", {
        key: j,
        rel: "modulepreload",
        href: j,
        ...r
    })), w.map( ({key: j, link: _}) => H.createElement("link", {
        key: j,
        nonce: r.nonce,
        ..._,
        crossOrigin: _.crossOrigin ?? r.crossOrigin
    })))
}
function o1(...s) {
    return a => {
        s.forEach(r => {
            typeof r == "function" ? r(a) : r != null && (r.current = a)
        }
        )
    }
}
var c1 = typeof window < "u" && typeof window.document < "u" && typeof window.document.createElement < "u";
try {
    c1 && (window.__reactRouterVersion = "7.13.1")
} catch {}
function f1({basename: s, children: a, unstable_useTransitions: r, window: u}) {
    let c = H.useRef();
    c.current == null && (c.current = Kx({
        window: u,
        v5Compat: !0
    }));
    let f = c.current
      , [d,m] = H.useState({
        action: f.action,
        location: f.location
    })
      , g = H.useCallback(p => {
        r === !1 ? m(p) : H.startTransition( () => m(p))
    }
    , [r]);
    return H.useLayoutEffect( () => f.listen(g), [f, g]),
    H.createElement(Yb, {
        basename: s,
        children: a,
        location: d.location,
        navigationType: d.action,
        navigator: f,
        unstable_useTransitions: r
    })
}
var rp = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i
  , up = H.forwardRef(function({onClick: a, discover: r="render", prefetch: u="none", relative: c, reloadDocument: f, replace: d, unstable_mask: m, state: g, target: p, to: b, preventScrollReset: x, viewTransition: E, unstable_defaultShouldRevalidate: S, ...w}, j) {
    let {basename: _, navigator: L, unstable_useTransitions: G} = H.useContext(Rt)
      , V = typeof b == "string" && rp.test(b)
      , J = $g(b, _);
    b = J.to;
    let W = Nb(b, {
        relative: c
    })
      , ue = fn()
      , I = null;
    if (m) {
        let fe = Ko(m, [], ue.unstable_mask ? ue.unstable_mask.pathname : "/", !0);
        _ !== "/" && (fe.pathname = fe.pathname === "/" ? _ : Vt([_, fe.pathname])),
        I = L.createHref(fe)
    }
    let[ye,Ce,k] = i1(u, w)
      , X = g1(b, {
        replace: d,
        unstable_mask: m,
        state: g,
        target: p,
        preventScrollReset: x,
        relative: c,
        viewTransition: E,
        unstable_defaultShouldRevalidate: S,
        unstable_useTransitions: G
    });
    function Z(fe) {
        a && a(fe),
        fe.defaultPrevented || X(fe)
    }
    let ne = !(J.isExternal || f)
      , oe = H.createElement("a", {
        ...w,
        ...k,
        href: (ne ? I : void 0) || J.absoluteURL || W,
        onClick: ne ? Z : a,
        ref: o1(j, Ce),
        target: p,
        "data-discover": !V && r === "render" ? "true" : void 0
    });
    return ye && !V ? H.createElement(H.Fragment, null, oe, H.createElement(s1, {
        page: W
    })) : oe
});
up.displayName = "Link";
var d1 = H.forwardRef(function({"aria-current": a="page", caseSensitive: r=!1, className: u="", end: c=!1, style: f, to: d, viewTransition: m, children: g, ...p}, b) {
    let x = ti(d, {
        relative: p.relative
    })
      , E = fn()
      , S = H.useContext(Us)
      , {navigator: w, basename: j} = H.useContext(Rt)
      , _ = S != null && b1(x) && m === !0
      , L = w.encodeLocation ? w.encodeLocation(x).pathname : x.pathname
      , G = E.pathname
      , V = S && S.navigation && S.navigation.location ? S.navigation.location.pathname : null;
    r || (G = G.toLowerCase(),
    V = V ? V.toLowerCase() : null,
    L = L.toLowerCase()),
    V && j && (V = on(V, j) || V);
    const J = L !== "/" && L.endsWith("/") ? L.length - 1 : L.length;
    let W = G === L || !c && G.startsWith(L) && G.charAt(J) === "/", ue = V != null && (V === L || !c && V.startsWith(L) && V.charAt(L.length) === "/"), I = {
        isActive: W,
        isPending: ue,
        isTransitioning: _
    }, ye = W ? a : void 0, Ce;
    typeof u == "function" ? Ce = u(I) : Ce = [u, W ? "active" : null, ue ? "pending" : null, _ ? "transitioning" : null].filter(Boolean).join(" ");
    let k = typeof f == "function" ? f(I) : f;
    return H.createElement(up, {
        ...p,
        "aria-current": ye,
        className: Ce,
        ref: b,
        style: k,
        to: d,
        viewTransition: m
    }, typeof g == "function" ? g(I) : g)
});
d1.displayName = "NavLink";
var h1 = H.forwardRef( ({discover: s="render", fetcherKey: a, navigate: r, reloadDocument: u, replace: c, state: f, method: d=Ts, action: m, onSubmit: g, relative: p, preventScrollReset: b, viewTransition: x, unstable_defaultShouldRevalidate: E, ...S}, w) => {
    let {unstable_useTransitions: j} = H.useContext(Rt)
      , _ = v1()
      , L = x1(m, {
        relative: p
    })
      , G = d.toLowerCase() === "get" ? "get" : "post"
      , V = typeof m == "string" && rp.test(m)
      , J = W => {
        if (g && g(W),
        W.defaultPrevented)
            return;
        W.preventDefault();
        let ue = W.nativeEvent.submitter
          , I = ue?.getAttribute("formmethod") || d
          , ye = () => _(ue || W.currentTarget, {
            fetcherKey: a,
            method: I,
            navigate: r,
            replace: c,
            state: f,
            relative: p,
            preventScrollReset: b,
            viewTransition: x,
            unstable_defaultShouldRevalidate: E
        });
        j && r !== !1 ? H.startTransition( () => ye()) : ye()
    }
    ;
    return H.createElement("form", {
        ref: w,
        method: G,
        action: L,
        onSubmit: u ? g : J,
        ...S,
        "data-discover": !V && s === "render" ? "true" : void 0
    })
}
);
h1.displayName = "Form";
function m1(s) {
    return `${s} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`
}
function op(s) {
    let a = H.useContext(Kl);
    return Xe(a, m1(s)),
    a
}
function g1(s, {target: a, replace: r, unstable_mask: u, state: c, preventScrollReset: f, relative: d, viewTransition: m, unstable_defaultShouldRevalidate: g, unstable_useTransitions: p}={}) {
    let b = tp()
      , x = fn()
      , E = ti(s, {
        relative: d
    });
    return H.useCallback(S => {
        if (Kb(S, a)) {
            S.preventDefault();
            let w = r !== void 0 ? r : Ia(x) === Ia(E)
              , j = () => b(s, {
                replace: w,
                unstable_mask: u,
                state: c,
                preventScrollReset: f,
                relative: d,
                viewTransition: m,
                unstable_defaultShouldRevalidate: g
            });
            p ? H.startTransition( () => j()) : j()
        }
    }
    , [x, b, E, r, u, c, a, s, f, d, m, g, p])
}
var p1 = 0
  , y1 = () => `__${String(++p1)}__`;
function v1() {
    let {router: s} = op("useSubmit")
      , {basename: a} = H.useContext(Rt)
      , r = Hb()
      , u = s.fetch
      , c = s.navigate;
    return H.useCallback(async (f, d={}) => {
        let {action: m, method: g, encType: p, formData: b, body: x} = $b(f, a);
        if (d.navigate === !1) {
            let E = d.fetcherKey || y1();
            await u(E, r, d.action || m, {
                unstable_defaultShouldRevalidate: d.unstable_defaultShouldRevalidate,
                preventScrollReset: d.preventScrollReset,
                formData: b,
                body: x,
                formMethod: d.method || g,
                formEncType: d.encType || p,
                flushSync: d.flushSync
            })
        } else
            await c(d.action || m, {
                unstable_defaultShouldRevalidate: d.unstable_defaultShouldRevalidate,
                preventScrollReset: d.preventScrollReset,
                formData: b,
                body: x,
                formMethod: d.method || g,
                formEncType: d.encType || p,
                replace: d.replace,
                state: d.state,
                fromRouteId: r,
                flushSync: d.flushSync,
                viewTransition: d.viewTransition
            })
    }
    , [u, c, a, r])
}
function x1(s, {relative: a}={}) {
    let {basename: r} = H.useContext(Rt)
      , u = H.useContext(cn);
    Xe(u, "useFormAction must be used inside a RouteContext");
    let[c] = u.matches.slice(-1)
      , f = {
        ...ti(s || ".", {
            relative: a
        })
    }
      , d = fn();
    if (s == null) {
        f.search = d.search;
        let m = new URLSearchParams(f.search)
          , g = m.getAll("index");
        if (g.some(b => b === "")) {
            m.delete("index"),
            g.filter(x => x).forEach(x => m.append("index", x));
            let b = m.toString();
            f.search = b ? `?${b}` : ""
        }
    }
    return (!s || s === ".") && c.route.index && (f.search = f.search ? f.search.replace(/^\?/, "?index&") : "?index"),
    r !== "/" && (f.pathname = f.pathname === "/" ? r : Vt([r, f.pathname])),
    Ia(f)
}
function b1(s, {relative: a}={}) {
    let r = H.useContext(Wg);
    Xe(r != null, "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  Did you accidentally import `RouterProvider` from `react-router`?");
    let {basename: u} = op("useViewTransitionState")
      , c = ti(s, {
        relative: a
    });
    if (!r.isTransitioning)
        return !1;
    let f = on(r.currentLocation.pathname, u) || r.currentLocation.pathname
      , d = on(r.nextLocation.pathname, u) || r.nextLocation.pathname;
    return Ls(c.pathname, d) != null || Ls(c.pathname, f) != null
}
function S1() {
    const s = fn();
    return y.jsxs("div", {
        className: "relative flex flex-col items-center justify-center h-screen text-center px-4",
        children: [y.jsx("h1", {
            className: "absolute bottom-0 text-9xl md:text-[12rem] font-black text-gray-50 select-none pointer-events-none z-0",
            children: "404"
        }), y.jsxs("div", {
            className: "relative z-10",
            children: [y.jsx("h1", {
                className: "text-xl md:text-2xl font-semibold mt-6",
                children: "This page has not been generated"
            }), y.jsx("p", {
                className: "mt-2 text-base text-gray-400 font-mono",
                children: s.pathname
            }), y.jsx("p", {
                className: "mt-4 text-lg md:text-xl text-gray-500",
                children: "Tell me more about this page, so I can generate it"
            })]
        })]
    })
}
function E1() {
    const [s,a] = H.useState(!1);
    return H.useEffect( () => {
        const r = () => {
            a(window.scrollY > 50)
        }
        ;
        return window.addEventListener("scroll", r),
        () => window.removeEventListener("scroll", r)
    }
    , []),
    y.jsx("nav", {
        className: `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${s ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"}`,
        children: y.jsx("div", {
            className: "w-full px-6 py-4",
            children: y.jsxs("div", {
                className: "flex items-center justify-between max-w-7xl mx-auto",
                children: [y.jsxs("div", {
                    className: "flex items-center space-x-2",
                    children: [y.jsx("div", {
                        className: "w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center",
                        children: y.jsx("i", {
                            className: "ri-sound-module-line text-white text-lg"
                        })
                    }), y.jsx("h1", {
                        className: "text-2xl font-bold text-slate-800 font-poppins",
                        children: "SoundSteps"
                    })]
                }), y.jsxs("div", {
                    className: "hidden md:flex items-center space-x-8",
                    children: [y.jsx("a", {
                        href: "#how-it-works",
                        className: "text-slate-600 hover:text-teal-600 transition-colors font-medium",
                        children: "How it Works"
                    }), y.jsx("a", {
                        href: "#mission",
                        className: "text-slate-600 hover:text-teal-600 transition-colors font-medium",
                        children: "Our Mission"
                    }), y.jsx("a", {
                        href: "#early-access",
                        className: "bg-coral-500 hover:bg-coral-600 text-white px-6 py-2 rounded-lg transition-colors font-medium whitespace-nowrap",
                        children: "Join Early Access"
                    })]
                }), y.jsx("div", {
                    className: "md:hidden",
                    children: y.jsx("button", {
                        className: "text-slate-600 hover:text-teal-600",
                        children: y.jsx("i", {
                            className: "ri-menu-line text-xl"
                        })
                    })
                })]
            })
        })
    })
}
function Do({children: s, variant: a="primary", size: r="md", onClick: u, className: c="", type: f="button", disabled: d=!1}) {
    const m = "font-medium rounded-lg transition-all duration-200 cursor-pointer whitespace-nowrap inline-flex items-center justify-center"
      , g = {
        primary: "bg-teal-600 hover:bg-teal-700 text-white shadow-lg hover:shadow-xl",
        secondary: "bg-sage-100 hover:bg-sage-200 text-sage-800 border border-sage-300",
        outline: "border-2 border-teal-600 text-teal-600 hover:bg-teal-50"
    }
      , p = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg"
    };
    return y.jsx("button", {
        type: f,
        onClick: u,
        disabled: d,
        className: `${m} ${g[a]} ${p[r]} ${d ? "opacity-50 cursor-not-allowed" : ""} ${c}`,
        children: s
    })
}
function w1() {
    return y.jsxs("section", {
        className: "relative min-h-screen flex items-center justify-center overflow-hidden",
        children: [y.jsx("div", {
            className: "absolute inset-0 bg-cover bg-center bg-no-repeat",
            style: {
                backgroundImage: "url('https://readdy.ai/api/search-image?query=a%20warm%20and%20tender%20scene%20of%20a%20loving%20mother%20sitting%20closely%20with%20her%20young%20toddler%20child%20on%20a%20soft%20cream%20sofa%20in%20a%20bright%20airy%20living%20room%2C%20the%20mother%20gently%20holds%20a%20picture%20book%20open%20while%20the%20child%20points%20at%20it%20with%20curiosity%2C%20soft%20natural%20daylight%20streams%20through%20large%20windows%2C%20lush%20indoor%20plants%20in%20the%20background%2C%20muted%20sage%20green%20and%20warm%20white%20interior%2C%20photorealistic%2C%20sharp%20focus%2C%20high%20resolution%2C%20professional%20lifestyle%20photography%2C%20calm%20and%20nurturing%20atmosphere%2C%20no%20text&width=1920&height=1080&seq=hero-bg-v3&orientation=landscape')"
            }
        }), y.jsx("div", {
            className: "absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/50"
        }), y.jsx("div", {
            className: "relative z-10 text-center px-6 w-full max-w-4xl mx-auto",
            children: y.jsxs("div", {
                className: "p-8 md:p-12",
                children: [y.jsxs("h2", {
                    className: "text-4xl md:text-6xl font-bold text-white mb-6 leading-tight font-poppins drop-shadow-lg",
                    children: ["Gentle Support for Your Child's", y.jsx("span", {
                        className: "text-teal-300 block",
                        children: "Speech Journey"
                    })]
                }), y.jsx("p", {
                    className: "text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow",
                    children: "While you wait for NHS support, SoundSteps provides structured, gentle speech practice tools designed by families who understand your journey."
                }), y.jsxs("div", {
                    className: "flex flex-col sm:flex-row gap-4 justify-center items-center",
                    children: [y.jsxs(Do, {
                        variant: "primary",
                        size: "lg",
                        className: "shadow-2xl",
                        onClick: () => document.getElementById("early-access")?.scrollIntoView({
                            behavior: "smooth"
                        }),
                        children: [y.jsx("i", {
                            className: "ri-user-add-line mr-2"
                        }), "Join Early Access"]
                    }), y.jsxs(Do, {
                        variant: "outline",
                        size: "lg",
                        className: "border-white/30 text-white hover:bg-white/10 backdrop-blur-sm",
                        onClick: () => document.getElementById("how-it-works")?.scrollIntoView({
                            behavior: "smooth"
                        }),
                        children: [y.jsx("i", {
                            className: "ri-play-circle-line mr-2"
                        }), "See How It Works"]
                    })]
                }), y.jsxs("div", {
                    className: "mt-8 flex items-center justify-center text-sm text-white/80",
                    children: [y.jsx("i", {
                        className: "ri-shield-check-line mr-2 text-teal-300"
                    }), "Free Early Access • UK-based • Parent-led approach"]
                })]
            })
        })]
    })
}
function _1() {
    const s = [{
        number: "1 in 10",
        text: "children have long-term speech and language needs",
        source: "NHS England"
    }, {
        number: "1.9-2M",
        text: "children struggle with speech and understanding",
        source: "ICAN Charity"
    }, {
        number: "68,000+",
        text: "children waiting for NHS speech therapy",
        source: "Royal College of Speech Therapists"
    }, {
        number: "5-8%",
        text: "of children have early language difficulties",
        source: "Department for Education"
    }];
    return y.jsx("section", {
        className: "py-20 bg-gradient-to-b from-slate-50 to-white",
        children: y.jsxs("div", {
            className: "max-w-6xl mx-auto px-6",
            children: [y.jsxs("div", {
                className: "text-center mb-16",
                children: [y.jsx("h2", {
                    className: "text-3xl md:text-5xl font-bold text-slate-800 mb-6 font-poppins",
                    children: "You're Not Alone in This Journey"
                }), y.jsx("p", {
                    className: "text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed",
                    children: "Many UK families face the same challenges when supporting their child's speech development. The wait for professional support can feel overwhelming, but there is hope."
                })]
            }), y.jsxs("div", {
                className: "grid md:grid-cols-2 gap-12 items-center mb-16",
                children: [y.jsxs("div", {
                    children: [y.jsx("h3", {
                        className: "text-2xl font-semibold text-slate-800 mb-6",
                        children: "Common Challenges Parents Face:"
                    }), y.jsxs("div", {
                        className: "space-y-4",
                        children: [y.jsxs("div", {
                            className: "flex items-start space-x-3",
                            children: [y.jsx("div", {
                                className: "w-6 h-6 bg-coral-100 rounded-full flex items-center justify-center mt-1",
                                children: y.jsx("i", {
                                    className: "ri-time-line text-coral-600 text-sm"
                                })
                            }), y.jsxs("div", {
                                children: [y.jsx("h4", {
                                    className: "font-medium text-slate-800",
                                    children: "Long NHS waiting times"
                                }), y.jsx("p", {
                                    className: "text-slate-600",
                                    children: "Families often wait months or years for speech therapy referrals"
                                })]
                            })]
                        }), y.jsxs("div", {
                            className: "flex items-start space-x-3",
                            children: [y.jsx("div", {
                                className: "w-6 h-6 bg-coral-100 rounded-full flex items-center justify-center mt-1",
                                children: y.jsx("i", {
                                    className: "ri-question-line text-coral-600 text-sm"
                                })
                            }), y.jsxs("div", {
                                children: [y.jsx("h4", {
                                    className: "font-medium text-slate-800",
                                    children: "Uncertainty about helping at home"
                                }), y.jsx("p", {
                                    className: "text-slate-600",
                                    children: "Parents want to help but lack structured guidance and confidence"
                                })]
                            })]
                        }), y.jsxs("div", {
                            className: "flex items-start space-x-3",
                            children: [y.jsx("div", {
                                className: "w-6 h-6 bg-coral-100 rounded-full flex items-center justify-center mt-1",
                                children: y.jsx("i", {
                                    className: "ri-tools-line text-coral-600 text-sm"
                                })
                            }), y.jsxs("div", {
                                children: [y.jsx("h4", {
                                    className: "font-medium text-slate-800",
                                    children: "Limited daily practice tools"
                                }), y.jsx("p", {
                                    className: "text-slate-600",
                                    children: "Few resources designed for consistent, gentle home practice"
                                })]
                            })]
                        })]
                    })]
                }), y.jsxs("div", {
                    className: "relative rounded-2xl overflow-hidden shadow-xl h-80",
                    style: {
                        backgroundImage: "url('https://readdy.ai/api/search-image?query=caring%20parent%20sitting%20with%20young%20child%20looking%20concerned%20but%20hopeful%2C%20soft%20natural%20lighting%2C%20warm%20home%20environment%2C%20gentle%20watercolor%20style%2C%20peaceful%20atmosphere%2C%20speech%20development%20support&width=600&height=400&seq=problem-illustration&orientation=landscape')"
                    },
                    children: [y.jsx("div", {
                        className: "absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"
                    }), y.jsxs("div", {
                        className: "absolute bottom-6 left-6 text-white",
                        children: [y.jsx("p", {
                            className: "text-lg font-medium",
                            children: `"We wanted to help but didn't know where to start"`
                        }), y.jsx("p", {
                            className: "text-sm opacity-90",
                            children: "- Parent from Manchester"
                        })]
                    })]
                })]
            }), y.jsxs("div", {
                className: "bg-white rounded-2xl shadow-xl p-8",
                children: [y.jsx("h3", {
                    className: "text-2xl font-semibold text-center text-slate-800 mb-8",
                    children: "UK Speech Development Statistics"
                }), y.jsx("div", {
                    className: "grid sm:grid-cols-2 lg:grid-cols-4 gap-6",
                    children: s.map( (a, r) => y.jsxs("div", {
                        className: "text-center p-6 bg-gradient-to-br from-teal-50 to-sage-50 rounded-xl border border-teal-100",
                        children: [y.jsx("div", {
                            className: "text-3xl font-bold text-teal-600 mb-2",
                            children: a.number
                        }), y.jsx("p", {
                            className: "text-slate-700 font-medium mb-2",
                            children: a.text
                        }), y.jsx("p", {
                            className: "text-xs text-slate-500",
                            children: a.source
                        })]
                    }, r))
                }), y.jsx("div", {
                    className: "mt-8 text-center",
                    children: y.jsxs("p", {
                        className: "text-slate-600 italic",
                        children: ["These statistics represent real families who need support.", y.jsx("strong", {
                            className: "text-slate-800",
                            children: " You're part of a caring community working together for better outcomes."
                        })]
                    })
                })]
            })]
        })
    })
}
function C1() {
    return y.jsx("section", {
        className: "py-20 bg-gradient-to-b from-white to-sage-50",
        children: y.jsxs("div", {
            className: "max-w-6xl mx-auto px-6",
            children: [y.jsxs("div", {
                className: "text-center mb-16",
                children: [y.jsxs("div", {
                    className: "inline-flex items-center bg-teal-100 text-teal-800 px-4 py-2 rounded-full text-sm font-medium mb-6",
                    children: [y.jsx("i", {
                        className: "ri-lightbulb-line mr-2"
                    }), "Introducing SoundSteps"]
                }), y.jsx("h2", {
                    className: "text-3xl md:text-5xl font-bold text-slate-800 mb-6 font-poppins",
                    children: "Gentle Support While You Wait"
                }), y.jsx("p", {
                    className: "text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-8",
                    children: "SoundSteps bridges the gap with structured, parent-led speech practice designed for daily home use. Created by families who understand your journey."
                })]
            }), y.jsxs("div", {
                className: "grid lg:grid-cols-2 gap-12 items-center",
                children: [y.jsxs("div", {
                    className: "relative rounded-2xl overflow-hidden shadow-xl h-96",
                    style: {
                        backgroundImage: "url('https://readdy.ai/api/search-image?query=modern%20smartphone%20showing%20speech%20therapy%20app%20interface%20with%20sound%20waves%20and%20progress%20tracking%2C%20parent%20and%20child%20using%20app%20together%2C%20soft%20colors%2C%20gentle%20UI%20design%2C%20family-friendly%20technology&width=600&height=500&seq=solution-app&orientation=portrait')"
                    },
                    children: [y.jsx("div", {
                        className: "absolute inset-0 bg-gradient-to-t from-teal-900/40 to-transparent"
                    }), y.jsx("div", {
                        className: "absolute bottom-6 left-6 right-6",
                        children: y.jsxs("div", {
                            className: "bg-white/90 backdrop-blur-sm rounded-lg p-4",
                            children: [y.jsx("p", {
                                className: "text-sm font-medium text-slate-800",
                                children: "✨ Simple, structured practice sessions"
                            }), y.jsx("p", {
                                className: "text-xs text-slate-600 mt-1",
                                children: "Designed for daily use at home"
                            })]
                        })
                    })]
                }), y.jsxs("div", {
                    className: "space-y-8",
                    children: [y.jsxs("div", {
                        children: [y.jsx("h3", {
                            className: "text-2xl font-semibold text-slate-800 mb-4",
                            children: "What Makes SoundSteps Different"
                        }), y.jsx("p", {
                            className: "text-slate-600 leading-relaxed mb-6",
                            children: "We understand that every family's journey is unique. SoundSteps provides gentle, evidence-based support that complements professional therapy—never replacing it."
                        })]
                    }), y.jsxs("div", {
                        className: "grid gap-6",
                        children: [y.jsxs("div", {
                            className: "flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm border border-sage-200",
                            children: [y.jsx("div", {
                                className: "w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center",
                                children: y.jsx("i", {
                                    className: "ri-parent-line text-teal-600 text-xl"
                                })
                            }), y.jsxs("div", {
                                children: [y.jsx("h4", {
                                    className: "font-semibold text-slate-800 mb-2",
                                    children: "Parent-Led Approach"
                                }), y.jsx("p", {
                                    className: "text-slate-600 text-sm",
                                    children: "You know your child best. Our tools empower you with confidence and structure."
                                })]
                            })]
                        }), y.jsxs("div", {
                            className: "flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm border border-sage-200",
                            children: [y.jsx("div", {
                                className: "w-12 h-12 bg-sage-100 rounded-lg flex items-center justify-center",
                                children: y.jsx("i", {
                                    className: "ri-calendar-check-line text-sage-600 text-xl"
                                })
                            }), y.jsxs("div", {
                                children: [y.jsx("h4", {
                                    className: "font-semibold text-slate-800 mb-2",
                                    children: "Daily Practice Made Simple"
                                }), y.jsx("p", {
                                    className: "text-slate-600 text-sm",
                                    children: "Short, gentle sessions that fit naturally into your daily routine."
                                })]
                            })]
                        }), y.jsxs("div", {
                            className: "flex items-start space-x-4 p-4 bg-white rounded-xl shadow-sm border border-sage-200",
                            children: [y.jsx("div", {
                                className: "w-12 h-12 bg-coral-100 rounded-lg flex items-center justify-center",
                                children: y.jsx("i", {
                                    className: "ri-heart-line text-coral-600 text-xl"
                                })
                            }), y.jsxs("div", {
                                children: [y.jsx("h4", {
                                    className: "font-semibold text-slate-800 mb-2",
                                    children: "Calm & Supportive"
                                }), y.jsx("p", {
                                    className: "text-slate-600 text-sm",
                                    children: "No pressure, no rush. Just gentle progress at your child's pace."
                                })]
                            })]
                        })]
                    }), y.jsxs("div", {
                        className: "bg-gradient-to-br from-teal-50 to-sage-50 rounded-xl p-6 border border-teal-200",
                        children: [y.jsxs("div", {
                            className: "flex items-center mb-3",
                            children: [y.jsx("i", {
                                className: "ri-information-line text-teal-600 mr-2"
                            }), y.jsx("span", {
                                className: "font-medium text-slate-800",
                                children: "Important Note"
                            })]
                        }), y.jsx("p", {
                            className: "text-slate-700 text-sm leading-relaxed",
                            children: "SoundSteps is designed to support families while waiting for professional help. We encourage continuing with NHS referrals and professional speech therapy alongside our tools."
                        })]
                    })]
                })]
            })]
        })
    })
}
function N1() {
    const s = [{
        number: "01",
        title: "Listen to a Sound",
        description: "Your child listens to clear, gentle sound examples designed for their development stage.",
        icon: "ri-volume-up-line",
        color: "teal"
    }, {
        number: "02",
        title: "Child Repeats",
        description: "In a safe, pressure-free environment, your child practices the sound at their own pace.",
        icon: "ri-mic-line",
        color: "sage"
    }, {
        number: "03",
        title: "Parent Encourages",
        description: "You provide gentle, positive reinforcement following our supportive guidance prompts.",
        icon: "ri-heart-line",
        color: "coral"
    }, {
        number: "04",
        title: "Progress Tracked",
        description: "Simple, visual progress tracking helps you see improvements over time.",
        icon: "ri-line-chart-line",
        color: "teal"
    }, {
        number: "05",
        title: "Gentle Suggestions",
        description: "Receive caring, personalized suggestions for continued practice and improvement.",
        icon: "ri-lightbulb-line",
        color: "sage"
    }]
      , a = {
        teal: "bg-teal-100 text-teal-600 border-teal-200",
        sage: "bg-sage-100 text-sage-600 border-sage-200",
        coral: "bg-coral-100 text-coral-600 border-coral-200"
    };
    return y.jsx("section", {
        id: "how-it-works",
        className: "py-20 bg-gradient-to-b from-sage-50 to-white",
        children: y.jsxs("div", {
            className: "max-w-6xl mx-auto px-6",
            children: [y.jsxs("div", {
                className: "text-center mb-16",
                children: [y.jsx("h2", {
                    className: "text-3xl md:text-5xl font-bold text-slate-800 mb-6 font-poppins",
                    children: "How SoundSteps Works"
                }), y.jsx("p", {
                    className: "text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed",
                    children: "Simple, structured steps designed to make speech practice feel natural and supportive for both you and your child."
                })]
            }), y.jsxs("div", {
                className: "relative",
                children: [y.jsx("div", {
                    className: "hidden lg:block",
                    children: y.jsx("div", {
                        className: "grid lg:grid-cols-5 gap-8",
                        children: s.map( (r, u) => y.jsxs("div", {
                            className: "relative",
                            children: [u < s.length - 1 && y.jsx("div", {
                                className: "absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-teal-200 to-sage-200 z-0"
                            }), y.jsxs("div", {
                                className: "relative z-10 text-center",
                                children: [y.jsx("div", {
                                    className: `w-24 h-24 mx-auto rounded-2xl ${a[r.color]} border-2 flex items-center justify-center mb-4 shadow-lg`,
                                    children: y.jsx("i", {
                                        className: `${r.icon} text-2xl`
                                    })
                                }), y.jsxs("div", {
                                    className: "bg-white rounded-xl p-6 shadow-lg border border-slate-200 min-h-[200px] flex flex-col",
                                    children: [y.jsx("div", {
                                        className: "text-sm font-bold text-slate-400 mb-2",
                                        children: r.number
                                    }), y.jsx("h3", {
                                        className: "font-semibold text-slate-800 mb-3 text-lg",
                                        children: r.title
                                    }), y.jsx("p", {
                                        className: "text-slate-600 text-sm leading-relaxed flex-grow",
                                        children: r.description
                                    })]
                                })]
                            })]
                        }, u))
                    })
                }), y.jsx("div", {
                    className: "lg:hidden space-y-8",
                    children: s.map( (r, u) => y.jsxs("div", {
                        className: "flex items-start space-x-4",
                        children: [y.jsx("div", {
                            className: `w-16 h-16 rounded-xl ${a[r.color]} border-2 flex items-center justify-center flex-shrink-0 shadow-lg`,
                            children: y.jsx("i", {
                                className: `${r.icon} text-xl`
                            })
                        }), y.jsxs("div", {
                            className: "flex-grow bg-white rounded-xl p-6 shadow-lg border border-slate-200",
                            children: [y.jsx("div", {
                                className: "text-sm font-bold text-slate-400 mb-1",
                                children: r.number
                            }), y.jsx("h3", {
                                className: "font-semibold text-slate-800 mb-2 text-lg",
                                children: r.title
                            }), y.jsx("p", {
                                className: "text-slate-600 leading-relaxed",
                                children: r.description
                            })]
                        })]
                    }, u))
                })]
            }), y.jsx("div", {
                className: "mt-16 bg-gradient-to-br from-teal-50 to-sage-50 rounded-2xl p-8 border border-teal-200",
                children: y.jsxs("div", {
                    className: "text-center",
                    children: [y.jsx("h3", {
                        className: "text-2xl font-semibold text-slate-800 mb-4",
                        children: "Ready to Start Your Journey?"
                    }), y.jsx("p", {
                        className: "text-slate-600 mb-6 max-w-2xl mx-auto",
                        children: "Join our early access program and help shape SoundSteps into the perfect tool for UK families. Your feedback will make a real difference."
                    }), y.jsxs("button", {
                        onClick: () => document.getElementById("early-access")?.scrollIntoView({
                            behavior: "smooth"
                        }),
                        className: "bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg font-medium transition-colors whitespace-nowrap shadow-lg hover:shadow-xl",
                        children: [y.jsx("i", {
                            className: "ri-arrow-down-line mr-2"
                        }), "Join Early Access Below"]
                    })]
                })
            })]
        })
    })
}
function T1() {
    const [s,a] = H.useState({
        parentName: "",
        email: "",
        location: "",
        hearAbout: "",
        childAge: "",
        appFor: "",
        supportStatus: "",
        mainConcern: "",
        feedbackWilling: "",
        localSupport: ""
    })
      , [r,u] = H.useState(!1)
      , [c,f] = H.useState(!1)
      , d = g => {
        const {name: p, value: b} = g.target;
        a(x => ({
            ...x,
            [p]: b
        }))
    }
      , m = async g => {
        g.preventDefault(),
        u(!0);
        try {
            const p = new FormData;
            Object.entries(s).forEach( ([x,E]) => {
                E.trim() && p.append(x, E)
            }
            ),
            (await fetch("https://readdy.ai/api/form/d6k86bigaju8afbcem1g", {
                method: "POST",
                body: p
            })).ok && f(!0)
        } catch (p) {
            console.error("Form submission error:", p)
        } finally {
            u(!1)
        }
    }
    ;
    return c ? y.jsx("section", {
        id: "early-access",
        className: "py-20 bg-gradient-to-b from-white to-teal-50",
        children: y.jsx("div", {
            className: "max-w-4xl mx-auto px-6 text-center",
            children: y.jsxs("div", {
                className: "bg-white rounded-2xl shadow-xl p-12 border border-teal-200",
                children: [y.jsx("div", {
                    className: "w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6",
                    children: y.jsx("i", {
                        className: "ri-check-line text-teal-600 text-2xl"
                    })
                }), y.jsx("h2", {
                    className: "text-3xl font-bold text-slate-800 mb-4",
                    children: "Thank You for Joining!"
                }), y.jsx("p", {
                    className: "text-xl text-slate-600 mb-6",
                    children: "Welcome to the SoundSteps early access community. We'll be in touch soon with updates on our progress."
                }), y.jsx("p", {
                    className: "text-slate-500",
                    children: "Your input will help us build something truly helpful for UK families."
                })]
            })
        })
    }) : y.jsx("section", {
        id: "early-access",
        className: "py-20 bg-gradient-to-b from-white to-teal-50",
        children: y.jsxs("div", {
            className: "max-w-4xl mx-auto px-6",
            children: [y.jsxs("div", {
                className: "text-center mb-12",
                children: [y.jsx("h2", {
                    className: "text-3xl md:text-5xl font-bold text-slate-800 mb-6 font-poppins",
                    children: "Help Shape SoundSteps"
                }), y.jsx("p", {
                    className: "text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed",
                    children: "Join our early access program and be part of building something meaningful for UK families. Your experience and feedback will directly influence how we develop SoundSteps."
                })]
            }), y.jsx("div", {
                className: "bg-white rounded-2xl shadow-xl p-8 border border-teal-200",
                children: y.jsxs("form", {
                    id: "early-access-form",
                    onSubmit: m,
                    "data-readdy-form": !0,
                    children: [y.jsxs("div", {
                        className: "grid md:grid-cols-2 gap-6 mb-6",
                        children: [y.jsxs("div", {
                            children: [y.jsx("label", {
                                className: "block text-sm font-medium text-slate-700 mb-2",
                                children: "Parent/Carer Name *"
                            }), y.jsx("input", {
                                type: "text",
                                name: "parentName",
                                value: s.parentName,
                                onChange: d,
                                required: !0,
                                className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm",
                                placeholder: "Your full name"
                            })]
                        }), y.jsxs("div", {
                            children: [y.jsx("label", {
                                className: "block text-sm font-medium text-slate-700 mb-2",
                                children: "Email Address *"
                            }), y.jsx("input", {
                                type: "email",
                                name: "email",
                                value: s.email,
                                onChange: d,
                                required: !0,
                                className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm",
                                placeholder: "your.email@example.com"
                            })]
                        })]
                    }), y.jsxs("div", {
                        className: "grid md:grid-cols-2 gap-6 mb-6",
                        children: [y.jsxs("div", {
                            children: [y.jsx("label", {
                                className: "block text-sm font-medium text-slate-700 mb-2",
                                children: "Location (City/Region) *"
                            }), y.jsx("input", {
                                type: "text",
                                name: "location",
                                value: s.location,
                                onChange: d,
                                required: !0,
                                className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm",
                                placeholder: "e.g. Manchester, London, etc."
                            })]
                        }), y.jsxs("div", {
                            children: [y.jsx("label", {
                                className: "block text-sm font-medium text-slate-700 mb-2",
                                children: "How did you hear about us? *"
                            }), y.jsxs("select", {
                                name: "hearAbout",
                                value: s.hearAbout,
                                onChange: d,
                                required: !0,
                                className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm",
                                children: [y.jsx("option", {
                                    value: "",
                                    children: "Please select"
                                }), y.jsx("option", {
                                    value: "social-media",
                                    children: "Social Media"
                                }), y.jsx("option", {
                                    value: "search-engine",
                                    children: "Search Engine"
                                }), y.jsx("option", {
                                    value: "friend-family",
                                    children: "Friend/Family"
                                }), y.jsx("option", {
                                    value: "healthcare-professional",
                                    children: "Healthcare Professional"
                                }), y.jsx("option", {
                                    value: "parenting-group",
                                    children: "Parenting Group"
                                }), y.jsx("option", {
                                    value: "other",
                                    children: "Other"
                                })]
                            })]
                        })]
                    }), y.jsxs("div", {
                        className: "grid md:grid-cols-2 gap-6 mb-6",
                        children: [y.jsxs("div", {
                            children: [y.jsx("label", {
                                className: "block text-sm font-medium text-slate-700 mb-2",
                                children: "Child's Age Range *"
                            }), y.jsxs("select", {
                                name: "childAge",
                                value: s.childAge,
                                onChange: d,
                                required: !0,
                                className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm",
                                children: [y.jsx("option", {
                                    value: "",
                                    children: "Please select"
                                }), y.jsx("option", {
                                    value: "18-24-months",
                                    children: "18-24 months"
                                }), y.jsx("option", {
                                    value: "2-3-years",
                                    children: "2-3 years"
                                }), y.jsx("option", {
                                    value: "3-4-years",
                                    children: "3-4 years"
                                }), y.jsx("option", {
                                    value: "4-5-years",
                                    children: "4-5 years"
                                }), y.jsx("option", {
                                    value: "5-6-years",
                                    children: "5-6 years"
                                }), y.jsx("option", {
                                    value: "6-plus-years",
                                    children: "6+ years"
                                })]
                            })]
                        }), y.jsxs("div", {
                            children: [y.jsx("label", {
                                className: "block text-sm font-medium text-slate-700 mb-2",
                                children: "Who is the app for? *"
                            }), y.jsxs("select", {
                                name: "appFor",
                                value: s.appFor,
                                onChange: d,
                                required: !0,
                                className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm",
                                children: [y.jsx("option", {
                                    value: "",
                                    children: "Please select"
                                }), y.jsx("option", {
                                    value: "my-child",
                                    children: "My child"
                                }), y.jsx("option", {
                                    value: "multiple-children",
                                    children: "Multiple children"
                                }), y.jsx("option", {
                                    value: "professional-use",
                                    children: "Professional use"
                                }), y.jsx("option", {
                                    value: "family-member",
                                    children: "Family member's child"
                                })]
                            })]
                        })]
                    }), y.jsxs("div", {
                        className: "mb-6",
                        children: [y.jsx("label", {
                            className: "block text-sm font-medium text-slate-700 mb-2",
                            children: "Current Support Status *"
                        }), y.jsxs("select", {
                            name: "supportStatus",
                            value: s.supportStatus,
                            onChange: d,
                            required: !0,
                            className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm",
                            children: [y.jsx("option", {
                                value: "",
                                children: "Please select"
                            }), y.jsx("option", {
                                value: "waiting-nhs",
                                children: "Waiting for NHS support"
                            }), y.jsx("option", {
                                value: "receiving-nhs",
                                children: "Currently receiving NHS support"
                            }), y.jsx("option", {
                                value: "receiving-private",
                                children: "Receiving private support"
                            }), y.jsx("option", {
                                value: "no-support",
                                children: "Not receiving any support"
                            }), y.jsx("option", {
                                value: "considering-referral",
                                children: "Considering seeking referral"
                            })]
                        })]
                    }), y.jsxs("div", {
                        className: "mb-6",
                        children: [y.jsx("label", {
                            className: "block text-sm font-medium text-slate-700 mb-2",
                            children: "What concerns you most about your child's speech development? *"
                        }), y.jsx("textarea", {
                            name: "mainConcern",
                            value: s.mainConcern,
                            onChange: d,
                            required: !0,
                            maxLength: 500,
                            rows: 4,
                            className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm resize-none",
                            placeholder: "Please share your main concerns or challenges (max 500 characters)"
                        }), y.jsxs("div", {
                            className: "text-right text-xs text-slate-500 mt-1",
                            children: [s.mainConcern.length, "/500 characters"]
                        })]
                    }), y.jsxs("div", {
                        className: "grid md:grid-cols-2 gap-6 mb-8",
                        children: [y.jsxs("div", {
                            children: [y.jsx("label", {
                                className: "block text-sm font-medium text-slate-700 mb-2",
                                children: "Would you be open to providing feedback?"
                            }), y.jsxs("select", {
                                name: "feedbackWilling",
                                value: s.feedbackWilling,
                                onChange: d,
                                className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm",
                                children: [y.jsx("option", {
                                    value: "",
                                    children: "Please select"
                                }), y.jsx("option", {
                                    value: "yes-definitely",
                                    children: "Yes, definitely"
                                }), y.jsx("option", {
                                    value: "yes-occasionally",
                                    children: "Yes, occasionally"
                                }), y.jsx("option", {
                                    value: "maybe",
                                    children: "Maybe"
                                }), y.jsx("option", {
                                    value: "prefer-not",
                                    children: "Prefer not to"
                                })]
                            })]
                        }), y.jsxs("div", {
                            children: [y.jsx("label", {
                                className: "block text-sm font-medium text-slate-700 mb-2",
                                children: "Is there enough local support in your area?"
                            }), y.jsxs("select", {
                                name: "localSupport",
                                value: s.localSupport,
                                onChange: d,
                                className: "w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm",
                                children: [y.jsx("option", {
                                    value: "",
                                    children: "Please select"
                                }), y.jsx("option", {
                                    value: "yes-adequate",
                                    children: "Yes, adequate support"
                                }), y.jsx("option", {
                                    value: "some-but-limited",
                                    children: "Some, but limited"
                                }), y.jsx("option", {
                                    value: "very-little",
                                    children: "Very little support"
                                }), y.jsx("option", {
                                    value: "none-available",
                                    children: "No support available"
                                }), y.jsx("option", {
                                    value: "unsure",
                                    children: "Unsure what's available"
                                })]
                            })]
                        })]
                    }), y.jsxs("div", {
                        className: "text-center",
                        children: [y.jsx(Do, {
                            type: "submit",
                            variant: "primary",
                            size: "lg",
                            disabled: r,
                            className: "shadow-xl",
                            children: r ? y.jsxs(y.Fragment, {
                                children: [y.jsx("i", {
                                    className: "ri-loader-4-line animate-spin mr-2"
                                }), "Joining Early Access..."]
                            }) : y.jsxs(y.Fragment, {
                                children: [y.jsx("i", {
                                    className: "ri-send-plane-line mr-2"
                                }), "Join Early Access"]
                            })
                        }), y.jsx("p", {
                            className: "text-sm text-slate-500 mt-4",
                            children: "By joining, you agree to receive updates about SoundSteps development. We respect your privacy and won't share your information."
                        })]
                    })]
                })
            })]
        })
    })
}
function j1() {
    return y.jsx("section", {
        id: "mission",
        className: "py-20 bg-gradient-to-b from-teal-50 to-sage-50",
        children: y.jsxs("div", {
            className: "max-w-6xl mx-auto px-6",
            children: [y.jsx("div", {
                className: "text-center mb-16",
                children: y.jsx("h2", {
                    className: "text-3xl md:text-5xl font-bold text-slate-800 mb-6 font-poppins",
                    children: "Our Mission"
                })
            }), y.jsxs("div", {
                className: "grid lg:grid-cols-2 gap-12 items-center mb-16",
                children: [y.jsxs("div", {
                    className: "relative rounded-2xl overflow-hidden shadow-xl h-96 order-2 lg:order-1",
                    style: {
                        backgroundImage: "url('https://readdy.ai/api/search-image?query=diverse%20group%20of%20UK%20families%20with%20young%20children%2C%20parents%20supporting%20each%20other%2C%20community%20feeling%2C%20warm%20natural%20lighting%2C%20inclusive%20representation%2C%20hope%20and%20determination%2C%20speech%20development%20journey&width=600&height=500&seq=mission-community&orientation=portrait')"
                    },
                    children: [y.jsx("div", {
                        className: "absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"
                    }), y.jsxs("div", {
                        className: "absolute bottom-6 left-6 right-6 text-white",
                        children: [y.jsx("p", {
                            className: "text-lg font-medium mb-2",
                            children: '"Every child deserves the best start"'
                        }), y.jsx("p", {
                            className: "text-sm opacity-90",
                            children: "Building tools that make a difference"
                        })]
                    })]
                }), y.jsxs("div", {
                    className: "order-1 lg:order-2",
                    children: [y.jsx("h3", {
                        className: "text-2xl font-semibold text-slate-800 mb-6",
                        children: "Bridging the Gap with Heart"
                    }), y.jsxs("div", {
                        className: "space-y-6",
                        children: [y.jsx("p", {
                            className: "text-slate-600 leading-relaxed",
                            children: "SoundSteps was born from the real experiences of UK families navigating speech development challenges. We saw the gap between needing support and receiving it, and knew we had to act."
                        }), y.jsxs("p", {
                            className: "text-slate-600 leading-relaxed",
                            children: [y.jsx("strong", {
                                className: "text-slate-800",
                                children: "We believe every child deserves the best possible start"
                            }), ", and every parent deserves tools that empower them with confidence and hope during the waiting period."]
                        }), y.jsxs("div", {
                            className: "bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-teal-200",
                            children: [y.jsxs("h4", {
                                className: "font-semibold text-slate-800 mb-3 flex items-center",
                                children: [y.jsx("i", {
                                    className: "ri-heart-line text-teal-600 mr-2"
                                }), "What Drives Us"]
                            }), y.jsxs("ul", {
                                className: "space-y-2 text-slate-600",
                                children: [y.jsxs("li", {
                                    className: "flex items-start space-x-2",
                                    children: [y.jsx("i", {
                                        className: "ri-check-line text-teal-600 mt-1 flex-shrink-0"
                                    }), y.jsx("span", {
                                        children: "Reducing anxiety for families waiting for support"
                                    })]
                                }), y.jsxs("li", {
                                    className: "flex items-start space-x-2",
                                    children: [y.jsx("i", {
                                        className: "ri-check-line text-teal-600 mt-1 flex-shrink-0"
                                    }), y.jsx("span", {
                                        children: "Empowering parents with structured, gentle guidance"
                                    })]
                                }), y.jsxs("li", {
                                    className: "flex items-start space-x-2",
                                    children: [y.jsx("i", {
                                        className: "ri-check-line text-teal-600 mt-1 flex-shrink-0"
                                    }), y.jsx("span", {
                                        children: "Creating tools that complement professional therapy"
                                    })]
                                }), y.jsxs("li", {
                                    className: "flex items-start space-x-2",
                                    children: [y.jsx("i", {
                                        className: "ri-check-line text-teal-600 mt-1 flex-shrink-0"
                                    }), y.jsx("span", {
                                        children: "Building a supportive community of UK families"
                                    })]
                                })]
                            })]
                        })]
                    })]
                })]
            }), y.jsxs("div", {
                className: "bg-white rounded-2xl shadow-xl p-8 border border-teal-200",
                children: [y.jsxs("div", {
                    className: "text-center mb-8",
                    children: [y.jsx("h3", {
                        className: "text-2xl font-semibold text-slate-800 mb-4",
                        children: "Shaped by Real Families, For Real Families"
                    }), y.jsx("p", {
                        className: "text-slate-600 max-w-3xl mx-auto leading-relaxed",
                        children: "Every feature in SoundSteps is informed by the experiences, challenges, and insights of families who have walked this path. Your early access participation directly shapes our development."
                    })]
                }), y.jsxs("div", {
                    className: "grid md:grid-cols-3 gap-8",
                    children: [y.jsxs("div", {
                        className: "text-center p-6 bg-gradient-to-br from-teal-50 to-sage-50 rounded-xl",
                        children: [y.jsx("div", {
                            className: "w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4",
                            children: y.jsx("i", {
                                className: "ri-group-line text-teal-600 text-2xl"
                            })
                        }), y.jsx("h4", {
                            className: "font-semibold text-slate-800 mb-2",
                            children: "Community-Driven"
                        }), y.jsx("p", {
                            className: "text-slate-600 text-sm",
                            children: "Built with input from real UK families experiencing speech development journeys."
                        })]
                    }), y.jsxs("div", {
                        className: "text-center p-6 bg-gradient-to-br from-sage-50 to-coral-50 rounded-xl",
                        children: [y.jsx("div", {
                            className: "w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4",
                            children: y.jsx("i", {
                                className: "ri-compass-3-line text-sage-600 text-2xl"
                            })
                        }), y.jsx("h4", {
                            className: "font-semibold text-slate-800 mb-2",
                            children: "Evidence-Based"
                        }), y.jsx("p", {
                            className: "text-slate-600 text-sm",
                            children: "Grounded in research and best practices, designed for real-world family use."
                        })]
                    }), y.jsxs("div", {
                        className: "text-center p-6 bg-gradient-to-br from-coral-50 to-teal-50 rounded-xl",
                        children: [y.jsx("div", {
                            className: "w-16 h-16 bg-coral-100 rounded-full flex items-center justify-center mx-auto mb-4",
                            children: y.jsx("i", {
                                className: "ri-infinite-line text-coral-600 text-2xl"
                            })
                        }), y.jsx("h4", {
                            className: "font-semibold text-slate-800 mb-2",
                            children: "Long-term Commitment"
                        }), y.jsx("p", {
                            className: "text-slate-600 text-sm",
                            children: "We're here for the journey, providing ongoing support as your child grows."
                        })]
                    })]
                }), y.jsxs("div", {
                    className: "mt-8 bg-gradient-to-r from-teal-600 to-sage-600 rounded-xl p-6 text-white text-center",
                    children: [y.jsx("p", {
                        className: "text-lg font-medium mb-2",
                        children: '"Together, we can make speech development support more accessible for every UK family."'
                    }), y.jsx("p", {
                        className: "text-teal-100 text-sm",
                        children: "— The SoundSteps Team"
                    })]
                })]
            })]
        })
    })
}
function O1() {
    return y.jsx("footer", {
        className: "bg-gradient-to-br from-slate-800 to-slate-900 text-white py-16",
        children: y.jsxs("div", {
            className: "max-w-6xl mx-auto px-6",
            children: [y.jsxs("div", {
                className: "grid md:grid-cols-3 gap-12",
                children: [y.jsxs("div", {
                    children: [y.jsxs("div", {
                        className: "flex items-center space-x-2 mb-6",
                        children: [y.jsx("div", {
                            className: "w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-500 rounded-lg flex items-center justify-center",
                            children: y.jsx("i", {
                                className: "ri-sound-module-line text-white text-xl"
                            })
                        }), y.jsx("h3", {
                            className: "text-2xl font-bold font-poppins",
                            children: "SoundSteps"
                        })]
                    }), y.jsx("p", {
                        className: "text-slate-300 leading-relaxed mb-6",
                        children: "Gentle speech development support for UK families. Created by parents, for parents who understand the journey."
                    }), y.jsx("div", {
                        className: "flex items-center space-x-4 text-slate-400",
                        children: y.jsxs("div", {
                            className: "flex items-center space-x-2",
                            children: [y.jsx("i", {
                                className: "ri-map-pin-line"
                            }), y.jsx("span", {
                                className: "text-sm",
                                children: "United Kingdom"
                            })]
                        })
                    })]
                }), y.jsxs("div", {
                    children: [y.jsx("h4", {
                        className: "text-lg font-semibold mb-6",
                        children: "Get in Touch"
                    }), y.jsxs("div", {
                        className: "space-y-4",
                        children: [y.jsxs("div", {
                            className: "flex items-center space-x-3",
                            children: [y.jsx("i", {
                                className: "ri-mail-line text-teal-400"
                            }), y.jsx("a", {
                                href: "mailto:hello@soundsteps.co.uk",
                                className: "text-slate-300 hover:text-white transition-colors",
                                children: "hello@soundsteps.co.uk"
                            })]
                        }), y.jsxs("div", {
                            className: "flex items-center space-x-3",
                            children: [y.jsx("i", {
                                className: "ri-customer-service-line text-teal-400"
                            }), y.jsx("span", {
                                className: "text-slate-300",
                                children: "Early Access Support"
                            })]
                        }), y.jsxs("div", {
                            className: "flex items-center space-x-3",
                            children: [y.jsx("i", {
                                className: "ri-time-line text-teal-400"
                            }), y.jsx("span", {
                                className: "text-slate-300",
                                children: "Mon-Fri, 9AM-5PM GMT"
                            })]
                        })]
                    }), y.jsx("div", {
                        className: "mt-6 pt-6 border-t border-slate-700",
                        children: y.jsxs("p", {
                            className: "text-sm text-slate-400",
                            children: ["Questions about your child's development?", y.jsx("br", {}), y.jsx("span", {
                                className: "text-slate-300",
                                children: "We're here to listen and support."
                            })]
                        })
                    })]
                }), y.jsxs("div", {
                    children: [y.jsx("h4", {
                        className: "text-lg font-semibold mb-6",
                        children: "Privacy & Trust"
                    }), y.jsxs("div", {
                        className: "space-y-3",
                        children: [y.jsxs("div", {
                            className: "flex items-start space-x-3",
                            children: [y.jsx("i", {
                                className: "ri-shield-check-line text-teal-400 mt-1"
                            }), y.jsxs("div", {
                                children: [y.jsx("p", {
                                    className: "text-slate-300 text-sm font-medium",
                                    children: "Privacy First"
                                }), y.jsx("p", {
                                    className: "text-slate-400 text-xs",
                                    children: "Your family's data is protected and never shared"
                                })]
                            })]
                        }), y.jsxs("div", {
                            className: "flex items-start space-x-3",
                            children: [y.jsx("i", {
                                className: "ri-lock-line text-teal-400 mt-1"
                            }), y.jsxs("div", {
                                children: [y.jsx("p", {
                                    className: "text-slate-300 text-sm font-medium",
                                    children: "Secure Platform"
                                }), y.jsx("p", {
                                    className: "text-slate-400 text-xs",
                                    children: "UK-based servers with enterprise-grade security"
                                })]
                            })]
                        }), y.jsxs("div", {
                            className: "flex items-start space-x-3",
                            children: [y.jsx("i", {
                                className: "ri-heart-line text-teal-400 mt-1"
                            }), y.jsxs("div", {
                                children: [y.jsx("p", {
                                    className: "text-slate-300 text-sm font-medium",
                                    children: "Built with Care"
                                }), y.jsx("p", {
                                    className: "text-slate-400 text-xs",
                                    children: "Designed by families who understand your needs"
                                })]
                            })]
                        })]
                    }), y.jsx("div", {
                        className: "mt-6",
                        children: y.jsxs("p", {
                            className: "text-xs text-slate-400 leading-relaxed",
                            children: ["SoundSteps Limited • Company registered in England & Wales", y.jsx("br", {}), "Supporting UK families since 2024"]
                        })
                    })]
                })]
            }), y.jsxs("div", {
                className: "mt-12 pt-8 border-t border-slate-700 text-center",
                children: [y.jsx("p", {
                    className: "text-slate-400 text-sm mb-4",
                    children: "© 2024 SoundSteps. Made with care for UK families."
                }), y.jsxs("div", {
                    className: "flex flex-wrap justify-center items-center gap-6 text-xs text-slate-500",
                    children: [y.jsx("a", {
                        href: "#privacy",
                        className: "hover:text-slate-300 transition-colors",
                        children: "Privacy Policy"
                    }), y.jsx("span", {
                        children: "•"
                    }), y.jsx("a", {
                        href: "#terms",
                        className: "hover:text-slate-300 transition-colors",
                        children: "Terms of Service"
                    }), y.jsx("span", {
                        children: "•"
                    }), y.jsx("a", {
                        href: "#cookies",
                        className: "hover:text-slate-300 transition-colors",
                        children: "Cookie Policy"
                    }), y.jsx("span", {
                        children: "•"
                    }), y.jsx("a", {
                        href: "#accessibility",
                        className: "hover:text-slate-300 transition-colors",
                        children: "Accessibility"
                    })]
                }), y.jsx("div", {
                    className: "mt-6 p-4 bg-slate-700/50 rounded-lg",
                    children: y.jsx("p", {
                        className: "text-sm text-slate-300 font-medium italic",
                        children: '"Every small step forward is progress worth celebrating."'
                    })
                })]
            })]
        })
    })
}
function A1() {
    return y.jsxs("div", {
        className: "min-h-screen",
        children: [y.jsx(E1, {}), y.jsx(w1, {}), y.jsx(_1, {}), y.jsx(C1, {}), y.jsx(N1, {}), y.jsx(T1, {}), y.jsx(j1, {}), y.jsx(O1, {})]
    })
}
const cp = [{
    path: "/",
    element: y.jsx(A1, {})
}, {
    path: "*",
    element: y.jsx(S1, {})
}]
  , R1 = Object.freeze(Object.defineProperty({
    __proto__: null,
    default: cp
}, Symbol.toStringTag, {
    value: "Module"
}));
let fp;
const M1 = new Promise(s => {
    fp = s
}
);
function dp() {
    const s = jb(cp)
      , a = tp();
    return H.useEffect( () => {
        window.REACT_APP_NAVIGATE = a,
        fp(window.REACT_APP_NAVIGATE)
    }
    ),
    s
}
const L1 = Object.freeze(Object.defineProperty({
    __proto__: null,
    AppRoutes: dp,
    navigatePromise: M1
}, Symbol.toStringTag, {
    value: "Module"
}));
function z1() {
    return y.jsx(wx, {
        i18n: et,
        children: y.jsx(f1, {
            basename: "/preview/666d6117-586a-47ce-9193-541a0779ed2f/6954280",
            children: y.jsx(dp, {})
        })
    })
}
Xx.createRoot(document.getElementById("root")).render(y.jsx(H.StrictMode, {
    children: y.jsx(z1, {})
}));
//# sourceMappingURL=index-NTGS7ORT.js.map
