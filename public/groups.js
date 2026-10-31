const gOf = p => (p.group || "").trim();
let curG = "";
const folders = () => {
  const l = (S.settings.groups || []).map(g => ({ name: g.name, image: g.image || "" }));
  for (const n of new Set(S.products.map(gOf).filter(Boolean))) if (!l.find(g => g.name === n)) l.push({ name: n, image: "" });
  return l;
};

V.product = () => {
  const cats = [...new Set(S.products.map(p => p.category).filter(Boolean))];
  return `<h2>${curG ? "📁 " + esc(curG) : "SẢN PHẨM"}</h2>${curG ? `<button class="btn alt sm" id="gback">← Tất cả</button>` : ""}
  <div class="row" style="margin-top:8px"><input id="q" placeholder="Tìm kiếm…" style="flex:2;min-width:140px"><select id="cat" style="flex:1"><option value="">Tất cả</option>${cats.map(c => `<option>${esc(c)}</option>`).join("")}</select><select id="so" style="flex:1"><option value="">Mặc định</option><option value="a">Giá tăng</option><option value="d">Giá giảm</option></select></div><div id="pl" class="grid"></div>`;
};
V.product.after = () => {
  if (curG) $("#gback").onclick = () => { curG = ""; render(); };
  const fl = folders();
  const f = () => {
    const q = $("#q").value.toLowerCase(), c = $("#cat").value, so = $("#so").value, pr = p => +(p.sale || p.price);
    let l = S.products.filter(p => (!c || p.category === c) && (p.name + " " + p.desc + " " + gOf(p)).toLowerCase().includes(q));
    if (so) l.sort((a, b) => so === "a" ? pr(a) - pr(b) : pr(b) - pr(a));
    let h = "";
    if (curG) h = l.filter(p => gOf(p) === curG).map(pcard).join("");
    else if (!q && !c) {
      h = [...new Set(l.map(gOf).filter(Boolean))].map(g => {
        const it = l.filter(p => gOf(p) === g), cover = (fl.find(x => x.name === g) || {}).image || (it.find(p => p.image) || {}).image || "", min = Math.min(...it.map(pr));
        return `<div class="card gdir" data-g="${esc(g)}" style="cursor:pointer"><div class="pimg">${img(cover, g)}<span class="tag">📁 THƯ MỤC</span></div><b>${esc(g)}</b><div class="mu" style="font-size:13px">${it.length} phiên bản</div><div class="price">Từ ${money(min)}</div><div style="margin-top:8px"><span class="btn sm">MỞ THƯ MỤC</span></div></div>`;
      }).join("") + l.filter(p => !gOf(p)).map(pcard).join("");
    } else h = l.map(pcard).join("");
    $("#pl").innerHTML = h || '<div class="card mu" style="grid-column:1/-1">Không có sản phẩm phù hợp.</div>';
    document.querySelectorAll(".gdir").forEach(e => e.onclick = () => { curG = e.dataset.g; render(); });
  };
  ["q", "cat", "so"].forEach(i => $("#" + i).oninput = f); f();
};
document.querySelector("nav a[data-r=product]").addEventListener("click", () => { curG = ""; render(); });

const _adm = V.admin, _after = V.admin.after;
V.admin = () => _adm().replace('<button class="btn sm red"', `<button class="btn sm ${tab === "folders" ? "" : "alt"}" onclick="tab='folders';render()">Thư mục</button><button class="btn sm red"`);
V.admin.after = _after;

A.folders = () => {
  const fl = folders();
  $("#ad").innerHTML = `<div class="card"><label>Tạo thư mục mới</label><div class="row"><input id="nf" placeholder="vd: AimPhantom" style="flex:1;margin:0"><button class="btn" id="nfb">+ TẠO</button></div></div>` +
    fl.map((g, i) => `<div class="card" style="margin-top:12px" data-f="${i}"><label>Tên thư mục</label><input data-k="name" value="${esc(g.name)}">${field("image", "Ảnh bìa (để trống = lấy ảnh sản phẩm đầu tiên)", g.image, "img")}
    <label>Tick chọn sản phẩm để bỏ vào thư mục này</label><div style="max-height:220px;overflow:auto;margin:6px 0 10px">${S.products.map(p => `<label class="row" style="color:var(--tx);padding:5px 0"><input type="checkbox" data-pid="${esc(p.id)}" ${gOf(p) === g.name ? "checked" : ""} style="width:auto;margin:0"> ${esc(p.name)}${gOf(p) && gOf(p) !== g.name ? ` <span class="mu">(đang ở: ${esc(gOf(p))})</span>` : ""}</label>`).join("") || '<span class="mu">Chưa có sản phẩm.</span>'}</div>
    <div class="row"><button class="btn fsv">LƯU THƯ MỤC</button><button class="btn red fdel">Xóa thư mục</button></div></div>`).join("");
  $("#nfb").onclick = async () => {
    const n = $("#nf").value.trim(); if (!n) return toast("Nhập tên thư mục");
    if (fl.some(x => x.name === n)) return toast("Tên thư mục đã có");
    if (await save("settings", { ...S.settings, groups: [...fl, { name: n, image: "" }] })) A.folders();
  };
  document.querySelectorAll("[data-f]").forEach(card => {
    const i = +card.dataset.f, g = fl[i]; bindImgs(card);
    card.querySelector(".fsv").onclick = async () => {
      const name = card.querySelector("[data-k=name]").value.trim(), image = card.querySelector("[data-k=image]").value;
      if (!name) return toast("Nhập tên thư mục");
      if (fl.some((x, j) => j !== i && x.name === name)) return toast("Tên thư mục đã có");
      const on = new Set([...card.querySelectorAll("[data-pid]")].filter(c => c.checked).map(c => c.dataset.pid));
      const prods = S.products.map(p => on.has(p.id) ? { ...p, group: name } : gOf(p) === g.name ? { ...p, group: "" } : p);
      const ng = fl.map((x, j) => j === i ? { name, image } : x);
      if (await save("products", prods) && await save("settings", { ...S.settings, groups: ng })) A.folders();
    };
    card.querySelector(".fdel").onclick = async () => {
      if (!confirm("Xóa thư mục này? Sản phẩm bên trong vẫn giữ, chỉ ra ngoài.")) return;
      const prods = S.products.map(p => gOf(p) === g.name ? { ...p, group: "" } : p);
      if (await save("products", prods) && await save("settings", { ...S.settings, groups: fl.filter((x, j) => j !== i) })) A.folders();
    };
  });
};

window.pform = id => {
  const p = S.products.find(x => x.id === id) || {};
  const m = modal(`<h3>${id ? "Sửa" : "Thêm"} sản phẩm</h3><div id="pf">${field("name", "Tên (vd: AIMPHANTOM VER 1)", p.name || "")}
  <label>Thư mục</label><select data-k="group"><option value="">(Không thư mục)</option>${folders().map(g => `<option ${g.name === gOf(p) ? "selected" : ""}>${esc(g.name)}</option>`).join("")}</select>
  ${field("desc", "Mô tả", p.desc || "", "area")}${field("price", "Giá gốc", p.price || "", "number")}${field("sale", "Giá khuyến mãi (để trống nếu không)", p.sale || "", "number")}${field("category", "Danh mục", p.category || "")}<label>Nhãn</label><select data-k="tag">${["", "HOT", "NEW", "SALE"].map(t => `<option ${t === (p.tag || "") ? "selected" : ""}>${t}</option>`).join("")}</select>${field("qty", "Số lượng (để trống = không giới hạn)", p.qty ?? "", "number")}${field("image", "Ảnh sản phẩm", p.image || "", "img")}</div><button class="btn" id="ps">LƯU</button>`);
  bindImgs(m);
  $("#ps").onclick = async () => {
    const d = collect($("#pf")); if (!d.name.trim() || !(+d.price > 0)) return toast("Cần tên và giá hợp lệ");
    const n = { id: p.id || crypto.randomUUID(), name: d.name.trim(), group: d.group.trim(), desc: d.desc, price: +d.price, sale: d.sale ? +d.sale : null, category: d.category.trim(), tag: d.tag, qty: d.qty === "" ? null : Math.max(0, +d.qty), image: d.image };
    if (await save("products", id ? S.products.map(x => x.id === id ? n : x) : [...S.products, n])) { m.remove(); A.products(); }
  };
};
save = async function (path, data) {
  try { S[path] = await api(path, JB("PUT", data)); toast("Đã lưu"); head(); return true; }
  catch (e) { toast(e.message); return false; }
};
