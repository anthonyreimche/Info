//#region src/rt.ts
var e, t;
function n(n) {
	t = n, e = n.react;
}
//#endregion
//#region src/KeywordEditor.tsx
var r = "safelight-keywords", i = "safelight-keywords-multi", a = "safelight-keywords-chips", o = "safelight-keyword", s = "safelight-keyword-remove", c = "safelight-keywords-field", l = "safelight-keywords-input", u = "safelight-keywords-suggestion", d = "safelight-keywords-suggestion-active";
function f(e) {
	return `
:where(.${r} > :not(:last-child)) { margin-block-end: 0.25rem; }
:where(.${i}) { margin-bottom: 0.25rem; font-size: 10px; color: ${e.textMuted}; }
:where(.${a}) { display: flex; flex-wrap: wrap; gap: 0.25rem; }
:where(.${o}) { display: inline-flex; align-items: center; gap: 0.125rem; border-radius: 0.25rem; background-color: ${e.surface3}; padding: 0.125rem 0.375rem; font-size: 10px; color: ${e.textSecondary}; }
:where(.${s}) { margin-left: 0.125rem; color: ${e.textMuted}; }
@media (hover: hover) { :where(.${s}:hover) { color: ${e.textPrimary}; } }
:where(.${c}) { position: relative; }
:where(.${l}) { width: 100%; border-radius: 0.25rem; background-color: ${e.surface2}; padding: 0.25rem 0.5rem; font-size: 11px; color: ${e.textPrimary}; outline-style: none; }
:where(.${l})::placeholder { color: ${e.textMuted}; }
:where(.${l}:focus) { box-shadow: 0 0 0 1px ${e.accent}; }
:where(.safelight-keywords-suggestions) { position: absolute; left: 0; right: 0; top: 100%; z-index: 50; margin-top: 0.125rem; border-radius: 0.25rem; border: 1px solid ${e.border}; background-color: ${e.surface1}; padding: 0.125rem 0; box-shadow: 0 10px 15px -3px #0000001a, 0 4px 6px -4px #0000001a; }
:where(.${u}) { display: flex; width: 100%; align-items: center; justify-content: space-between; padding: 0.25rem 0.5rem; font-size: 11px; color: ${e.textSecondary}; }
@media (hover: hover) { :where(.${u}:not(.${d}):hover) { background-color: ${e.surface2}; } }
:where(.${d}) { background-color: color-mix(in oklab, ${e.accent} 20%, transparent); color: ${e.textPrimary}; }
:where(.safelight-keywords-count) { color: ${e.textMuted}; }
html.sl-larger-text .${i}, html.sl-larger-text .${o} { font-size: 12px !important; }
html.sl-larger-text .${l}, html.sl-larger-text .${u} { font-size: 13px !important; line-height: 1.45 !important; }
`;
}
function p() {
	let n = t.stores.useCatalogStore, u = n((e) => e.photos), d = n((e) => e.selectedIds), f = n((e) => e.activePhotoId), p = n((e) => e.addKeyword), m = n((e) => e.removeKeyword), h = n((e) => e.addKeywords), g = n((e) => e.removeKeywords), [_, v] = e.useState(""), [y, b] = e.useState(!1), [x, S] = e.useState(0), C = e.useRef(null), w = e.useRef(null), T = e.useMemo(() => d.size > 1 ? [...d] : f ? [f] : [], [d, f]), E = e.useMemo(() => {
		let e = new Set(T);
		return u.filter((t) => e.has(t.id));
	}, [u, T]), D = e.useMemo(() => {
		if (E.length === 0) return [];
		if (E.length === 1) return E[0].keywords;
		let e = new Set(E[0].keywords);
		for (let t = 1; t < E.length; t++) {
			let n = new Set(E[t].keywords);
			for (let t of e) n.has(t) || e.delete(t);
		}
		return [...e];
	}, [E]), O = e.useMemo(() => {
		let e = /* @__PURE__ */ new Map();
		for (let t of u) for (let n of t.keywords) e.set(n, (e.get(n) ?? 0) + 1);
		return e;
	}, [u]), k = e.useMemo(() => {
		let e = _.trim().toLowerCase();
		if (!e) return [];
		let t = new Set(D.map((e) => e.toLowerCase()));
		return [...O.entries()].filter(([n]) => n.toLowerCase().includes(e) && !t.has(n.toLowerCase())).sort((e, t) => t[1] - e[1]).slice(0, 8);
	}, [
		_,
		O,
		D
	]);
	if (e.useEffect(() => {
		S(0);
	}, [k.length]), e.useEffect(() => {
		let e = (e) => {
			w.current && !w.current.contains(e.target) && b(!1);
		};
		return document.addEventListener("mousedown", e), () => document.removeEventListener("mousedown", e);
	}, []), e.useEffect(() => {
		let e = t.events.FOCUS_KEYWORD_INPUT, n = () => C.current?.focus();
		return window.addEventListener(e, n), () => window.removeEventListener(e, n);
	}, []), T.length === 0) return null;
	let A = (e) => {
		let t = e.trim();
		t && (T.length > 1 ? h(T, [t]) : p(T[0], t), v(""), b(!1));
	}, j = (e) => {
		T.length > 1 ? g(T, [e]) : m(T[0], e);
	}, M = (e) => {
		e.key === "Enter" || e.key === "," ? (e.preventDefault(), y && k.length > 0 ? A(k[x][0]) : A(_)) : e.key === "Escape" ? (b(!1), C.current?.blur()) : e.key === "ArrowDown" && y ? (e.preventDefault(), S((e) => Math.min(e + 1, k.length - 1))) : e.key === "ArrowUp" && y ? (e.preventDefault(), S((e) => Math.max(e - 1, 0))) : e.key === "Backspace" && _ === "" && D.length > 0 && j(D[D.length - 1]);
	}, N = T.length > 1 ? /* @__PURE__ */ e.createElement("span", { className: i }, "Editing ", T.length, " photos (shared keywords)") : null;
	return /* @__PURE__ */ e.createElement("div", {
		ref: w,
		className: r
	}, N, /* @__PURE__ */ e.createElement("div", { className: a }, D.map((t) => /* @__PURE__ */ e.createElement("span", {
		key: t,
		className: o
	}, t, /* @__PURE__ */ e.createElement("button", {
		onClick: () => j(t),
		className: s,
		"aria-label": `Remove keyword ${t}`
	}, /* @__PURE__ */ e.createElement("span", { "aria-hidden": "true" }, "×"))))), /* @__PURE__ */ e.createElement("div", { className: c }, /* @__PURE__ */ e.createElement("input", {
		ref: C,
		value: _,
		onChange: (e) => {
			v(e.target.value), b(!0);
		},
		onFocus: () => b(!0),
		onKeyDown: M,
		placeholder: "Add keyword…",
		"aria-label": "Add keyword",
		className: l
	}), y && k.length > 0 && /* @__PURE__ */ e.createElement("div", { className: "safelight-keywords-suggestions" }, k.map(([t, n], r) => /* @__PURE__ */ e.createElement("button", {
		key: t,
		onMouseDown: (e) => {
			e.preventDefault(), A(t);
		},
		onMouseEnter: () => S(r),
		className: r === x ? "safelight-keywords-suggestion safelight-keywords-suggestion-active" : "safelight-keywords-suggestion"
	}, /* @__PURE__ */ e.createElement("span", null, t), /* @__PURE__ */ e.createElement("span", { className: "safelight-keywords-count" }, n))))));
}
//#endregion
//#region src/MetadataPanel.tsx
var m = "safelight-info-empty", h = "safelight-info-rating", g = "safelight-info-fields", _ = "safelight-info-field", v = "safelight-info-label", y = "safelight-info-value";
function b(e) {
	return `
:where(.${m}) { font-size: 11px; color: ${e.textMuted}; }
:where(.${h}) { margin-bottom: 0.375rem; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; font-size: 11px; }
:where(.${g} > :not(:last-child)) { margin-block-end: 0.125rem; }
:where(.${_}) { display: flex; justify-content: space-between; gap: 0.5rem; font-size: 11px; }
:where(.${v}) { flex-shrink: 0; color: ${e.textMuted}; }
:where(.${y}) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: right; color: ${e.textSecondary}; }
html.sl-larger-text .${m}, html.sl-larger-text .${h}, html.sl-larger-text .${_} { font-size: 13px !important; line-height: 1.45 !important; }
`;
}
function x(e) {
	return e >= 1 << 20 ? `${(e / (1 << 20)).toFixed(1)} MB` : e >= 1024 ? `${Math.round(e / 1024)} KB` : `${e} B`;
}
function S(e) {
	if (!e) return;
	let t = e.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2})/);
	return t ? `${t[1]}-${t[2]}-${t[3]} ${t[4]}:${t[5]}` : e;
}
function C(e) {
	if (e.focalLength) return e.focalLength35mm && e.focalLength35mm !== e.focalLength ? `${e.focalLength} mm (${e.focalLength35mm} mm eq.)` : `${e.focalLength} mm`;
}
function w(e) {
	if (e !== void 0 && e !== 0) return `${e > 0 ? "+" : ""}${e} EV`;
}
function T(e) {
	let t = w(e.baselineExposure ?? void 0);
	return t && e.baselineShadows ? `${t}, Shadows +${e.baselineShadows}` : t;
}
function E(e, t) {
	if (e === void 0 || t === void 0) return;
	let n = e >= 0 ? "N" : "S", r = t >= 0 ? "E" : "W";
	return `${Math.abs(e).toFixed(4)}° ${n}, ${Math.abs(t).toFixed(4)}° ${r}`;
}
function D(e) {
	if (e !== void 0) return `${e} m`;
}
function O(e) {
	if (e !== void 0) return e >= 1 ? `${e} m` : `${Math.round(e * 100)} cm`;
}
function k(e) {
	if (e.lens) return e.lensMake && !e.lens.startsWith(e.lensMake) ? `${e.lensMake} ${e.lens}` : e.lens;
}
function A() {
	let { Panel: n, Rating: r } = t.components, i = t.stores.useCatalogStore, a = i((e) => e.photos.find((t) => t.id === e.activePhotoId)), o = i((e) => e.setRating), s = a?.metadataPending ? a.id : null;
	if (e.useEffect(() => {
		t.catalog.settleSelectedPhoto(s);
	}, [s]), !a) return /* @__PURE__ */ e.createElement(n, { title: "Metadata" }, /* @__PURE__ */ e.createElement("p", { className: m }, "Select a photo"));
	let c = a.exif, l = [c.cameraMake, c.cameraModel].filter(Boolean).join(" "), u = c.gpsLatitude !== void 0 && c.gpsLongitude !== void 0, d = [
		["Filename", a.filename],
		["Artist", c.artist],
		["Copyright", c.copyright],
		["Description", c.imageDescription],
		["Camera", l || void 0],
		["Body S/N", c.bodySerial],
		["Software", c.software],
		["Lens", k(c)],
		["Lens S/N", c.lensSerial],
		["Focal length", C(c)],
		["Max aperture", c.maxAperture ? `f/${c.maxAperture}` : void 0],
		["Aperture", c.aperture ? `f/${c.aperture}` : void 0],
		["Shutter", c.shutterSpeed],
		["ISO", c.iso ? `${c.iso}` : void 0],
		["Program", c.exposureProgram],
		["Exp. mode", c.exposureMode],
		["Exp. comp.", w(c.exposureCompensation)],
		["Raw exp. bias", w(c.rawExposureBias)],
		["Camera match", T(c)],
		["Metering", c.meteringMode],
		["White balance", c.whiteBalance],
		["Flash", c.flash],
		["Focus dist.", O(c.subjectDistance)],
		["Scene", c.sceneCaptureType],
		["Colour space", c.colorSpace],
		["Date", S(c.dateTimeOriginal)],
		["Location", E(c.gpsLatitude, c.gpsLongitude)],
		["Altitude", u ? D(c.gpsAltitude) : void 0],
		["Dimensions", a.width && a.height ? `${a.width} × ${a.height}` : void 0],
		["Size", x(a.fileSize)],
		["Type", a.mimeType || void 0]
	].filter((e) => !!e[1]);
	return /* @__PURE__ */ e.createElement(n, { title: "Metadata" }, /* @__PURE__ */ e.createElement("div", { className: h }, /* @__PURE__ */ e.createElement("span", { className: v }, "Rating"), /* @__PURE__ */ e.createElement(r, {
		value: a.rating,
		onChange: (e) => o(a.id, e),
		size: "md"
	})), /* @__PURE__ */ e.createElement("dl", { className: g }, d.map(([t, n]) => /* @__PURE__ */ e.createElement("div", {
		key: t,
		className: _
	}, /* @__PURE__ */ e.createElement("dt", { className: v }, t), /* @__PURE__ */ e.createElement("dd", {
		className: y,
		title: n
	}, n)))));
}
//#endregion
//#region src/InfoPanel.tsx
var j = "safelight-info";
function M(e) {
	return `
:where(.${j}) { display: flex; flex-direction: column; }
${f(e).trim()}
${b(e).trim()}
`;
}
function N() {
	let { Panel: n } = t.components;
	return /* @__PURE__ */ e.createElement("div", { className: j }, /* @__PURE__ */ e.createElement(P, null), /* @__PURE__ */ e.createElement(n, { title: "Keywords" }, /* @__PURE__ */ e.createElement(p, null)), /* @__PURE__ */ e.createElement(A, null));
}
function P() {
	let { Histogram: n } = t.components, r = t.stores.useCatalogStore, i = r((e) => e.activePhotoId), a = r((e) => e.photos.find((t) => t.id === e.activePhotoId)?.thumbnailUrl), o = r((e) => e.photos.find((t) => t.id === e.activePhotoId)?.rotation), s = r((e) => e.photos.find((t) => t.id === e.activePhotoId)?.exif.colorTemperature), c = r((e) => e.fileAccessNonce), [l, u] = e.useState(null), [d, f] = e.useState(0);
	return e.useEffect(() => {
		if (i) return t.events.onBroadcast((e) => {
			e.type === "edit-update" && e.payload.photoId === i && f((e) => e + 1);
		});
	}, [i]), e.useEffect(() => {
		let e = !1;
		if (!i) u(null);
		else return (async () => {
			let n = r.getState().photos.find((e) => e.id === i);
			if (!n) {
				u(null);
				return;
			}
			let a = await t.catalog.renderHistogram(n);
			e || u(a);
		})(), () => {
			e = !0;
		};
	}, [
		i,
		a,
		o,
		s,
		c,
		d
	]), /* @__PURE__ */ e.createElement(n, { data: l });
}
//#endregion
//#region src/index.tsx
var F = "core.info", I = "safelight.info.styles";
function L(e) {
	n(e), e.registerStylesheet({
		id: I,
		css: M(e.ui.tokens)
	}), e.registerPanel({
		id: F,
		title: "Info",
		component: N,
		defaultDock: {
			module: "library",
			direction: "right",
			order: 0,
			width: 280
		}
	});
}
//#endregion
export { F as PANEL_ID, I as STYLESHEET_ID, L as activate };

//# sourceMappingURL=index.js.map