const gOf = p => (p.group || "").trim();
let curG = "";

V.product = () => {
  const cats = [...new Set(S.products.map(p => p.category).filter(Boolean))];
  return `<h2>${curG ? "📁 " + esc(curG) : "SẢN PHẨM"}</h2>${curG ? `<button class="btn alt sm" id="gback">← Tất cả</button>` : ""}
  <div class="row" style="margin-top:8px"><input id="q" placeholder="Tìm kiếm…" style="flex:2;min-width:140px"><select id="cat" style="flex:1"><option value="">Tất cả</option>${cats.map(c => `<option>${esc(c)}</option>`).join("")}</select><select id="so" style="flex:1"><option value="">Mặc định</option><option value="a">Giá tăng</option><option value="d">Giá giảm</option></select></div><div id="pl" class="grid"></div>`;
};
V.product.after = () => {
  if (curG) $("#gback").onclick = () => { curG = ""; render(); };
  const f = () => {
    const q = $("#q").value.toLowerCase(), c = $("#cat").value, so = $("#so").value, pr = p => +(p.sale || p.price);
    let l = S.products.filter(p => (!c || p.category === c) && (p.name + " " + p.desc + " " + gOf(p)).toLowerCase().includes(q));
    if (so) l.sort((a, b) => so === "a" ? pr(a) - pr(b) : pr(b) - pr(a));
    let h = "";
    if (curG) h = l.filter(p => gOf(p) === curG).map(pcard).join("");
    else if (!q && !c) {
      h = [...new Set(l.map(gOf).filter(Boolean))].map(g => {
        const it = l.filter(p => gOf(p) === g), cover = (it.find(p => p.image) || {}).image || "", min = Math.min(...it.map(pr));
        return `<div class="card gdir" data-g="${esc(g)}" style="cursor:pointer"><div class="pimg">${img(cover, g)}<span class="tag">📁 THƯ MỤC</span></div><b>${esc(g)}</b><div class="mu" style="font-size:13px">${it.length} phiên bản</div><div class="price">Từ ${money(min)}</div><div style="margin-top:8px"><span class="btn sm">MỞ THƯ MỤC</span></div></div>`;
      }).join("") + l.filter(p => !gOf(p)).map(pcard).join("");
    } else h = l.map(pcard).join("");
    $("#pl").innerHTML = h || '<div class="card mu" style="grid-column:1/-1">Không có sản phẩm phù hợp.</div>';
    document.querySelectorAll(".gdir").forEach(e => e.onclick = () => { curG = e.dataset.g; render(); });
  };
  ["q", "cat", "so"].forEach(i => $("#" + i).oninput = f); f();
};
document.querySelector("nav a[data-r=product]").addEventListener("click", () => { curG = ""; render(); });

window.pform = id => {
  const p = S.products.find(x => x.id === id) || {};
  const groups = [...new Set(S.products.map(gOf).filter(Boolean))];
  const m = modal(`<h3>${id ? "Sửa" : "Thêm"} sản phẩm</h3><div id="pf">${field("name", "Tên (vd: AIMPHANTOM VER 1)", p.name || "")}
  <label>Thư mục (vd: AimPhantom — để trống nếu không gom)</label><input data-k="group" list="gl" value="${esc(p.group || "")}"><datalist id="gl">${groups.map(g => `<option value="${esc(g)}">`).join("")}</datalist>
  ${field("desc", "Mô tả", p.desc || "", "area")}${field("price", "Giá gốc", p.price || "", "number")}${field("sale", "Giá khuyến mãi (để trống nếu không)", p.sale || "", "number")}${field("category", "Danh mục", p.category || "")}<label>Nhãn</label><select data-k="tag">${["", "HOT", "NEW", "SALE"].map(t => `<option ${t === (p.tag || "") ? "selected" : ""}>${t}</option>`).join("")}</select>${field("qty", "Số lượng (để trống = không giới hạn)", p.qty ?? "", "number")}${field("image", "Ảnh sản phẩm", p.image || "", "img")}</div><button class="btn" id="ps">LƯU</button>`);
  bindImgs(m);
  $("#ps").onclick = async () => {
    const d = collect($("#pf")); if (!d.name.trim() || !(+d.price > 0)) return toast("Cần tên và giá hợp lệ");
    const n = { id: p.id || crypto.randomUUID(), name: d.name.trim(), group: d.group.trim(), desc: d.desc, price: +d.price, sale: d.sale ? +d.sale : null, category: d.category.trim(), tag: d.tag, qty: d.qty === "" ? null : Math.max(0, +d.qty), image: d.image };
    if (await save("products", id ? S.products.map(x => x.id === id ? n : x) : [...S.products, n])) { m.remove(); A.products(); }
  };
};
