"use client";
import { useEffect, useState } from "react";
import {
  api,
  Button,
  Field,
  Modal,
  Notice,
  Empty,
  Badge,
  useApp,
  useForm,
} from "./ui";
import { money, datetime } from "@/lib/format";
const config: any = {
  products: {
    title: "Quản lý sản phẩm",
    singular: "sản phẩm",
    empty: "Không tìm thấy sản phẩm!",
    code: "Mã sản phẩm",
    name: "Tên sản phẩm",
  },
  suppliers: {
    title: "Quản lý nhà cung cấp",
    singular: "nhà cung cấp",
    empty: "Không tìm thấy nhà cung cấp!",
    code: "Mã nhà cung cấp",
    name: "Tên nhà cung cấp",
  },
  customers: {
    title: "Quản lý khách hàng",
    singular: "khách hàng",
    empty: "Không tìm thấy khách hàng phù hợp",
    code: "Mã khách hàng",
    name: "Tên khách hàng",
  },
};
export default function Masters({ kind }: any) {
  const { data, refresh, notify, confirm } = useApp();
  const c = config[kind];
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<any[]>(data[kind] || []);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [detail, setDetail] = useState<any>(null);
  const [price, setPrice] = useState<any>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setRows(data[kind] || []);
    setSelected(null);
  }, [data, kind]);
  async function search(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    try {
      const r = await api("query", { scope: kind, q, category, status });
      setRows(r);
      setSelected(null);
    } catch (e: any) {
      setRows([]);
      setError(e.message);
    }
  }
  async function showDetail(row: any) {
    if (kind === "customers") {
      try {
        setDetail(await api("detail?type=customer&id=" + row.id));
      } catch (e: any) {
        setError(e.message);
      }
    } else setDetail(row);
  }
  function remove() {
    if (!selected) return;
    const msg =
      kind === "products"
        ? "Bạn có chắc chắn muốn xóa sản phẩm này?"
        : kind === "suppliers"
          ? "Bạn có chắc chắn muốn xóa nhà cung cấp này?"
          : "Bạn có chắc chắn muốn xóa khách hàng này không?";
    confirm(
      msg,
      async () => {
        try {
          const r = await api("action", {
            action: "delete-" + kind,
            id: selected.id,
          });
          notify(r.message);
          await refresh();
        } catch (e: any) {
          setError(e.message);
        }
      },
      kind === "customers" ? "Đồng ý" : "Xác nhận",
      kind === "customers" ? ["Quay lại", "Hủy"] : "Quay lại",
    );
  }
  const toolbar = (
        <div className="card-head">
          <div className="row">
            <Button variant="primary" onClick={() => setForm({})}>
              {kind !== "customers" ? <img src={kind === "suppliers" ? "/figma/a3829.svg" : "/figma/9fda3.svg"} width="16" height="16" alt="" /> : <img src="/figma/1cd29.svg" width="16" height="16" alt="" />}Thêm {c.singular}
            </Button>
            <Button disabled={!selected} onClick={() => setForm(selected)}>
              {kind !== "customers" && <img src={kind === "suppliers" ? "/figma/390c0.svg" : "/figma/b3751.svg"} width="16" height="16" alt="" />}{kind === "customers" && <img src="/figma/8ebed.svg" width="16" height="16" alt="" />}Sửa
            </Button>
            <Button disabled={!selected} variant="danger" onClick={remove}>
              {kind !== "customers" && <img src={kind === "suppliers" ? "/figma/f8244.svg" : "/figma/a04e9.svg"} width="16" height="16" alt="" />}{kind === "customers" && <img src="/figma/d1421.svg" width="16" height="16" alt="" />}Xóa
            </Button>
            {kind === "products" && (
              <Button disabled={!selected} onClick={() => setPrice(selected)}>
                <img src="/figma/dbe96.svg" width="16" height="16" alt="" />Cập nhật giá bán
              </Button>
            )}
          </div>
        </div>
  );
  const controls = <>
        <form className="filters" onSubmit={search}>
          <div className="field search">
            {kind === "customers" && <img src="/figma/ab536.svg" width="16" height="16" alt="" />}
            {kind !== "customers" && <img src={kind === "suppliers" ? "/figma/21532.svg" : "/figma/35b85.svg"} width="16" height="16" alt="" />}
            <input
              aria-label="Từ khóa"
              placeholder={
                kind === "customers"
                  ? "Nhập mã, tên hoặc số điện thoại khách hàng"
                  : `Tìm theo mã hoặc tên ${c.singular}...`
              }
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          {kind !== "customers" ? (
            <div className="product-category-filter">
              <label htmlFor="product-category">Danh mục:</label>
              <select id="product-category" aria-label="Danh mục" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Tất cả</option>
                {data.categories.map((x: any) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </select>
              <img src={kind === "suppliers" ? "/figma/002a0.svg" : "/figma/b4dfe.svg"} width="14" height="14" alt="" />
            </div>
          ) : kind !== "customers" && (
            <Field label="Danh mục">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Tất cả</option>
                {data.categories.map((x: any) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {kind === "suppliers" && (
            <div className="product-category-filter supplier-status-filter">
              <label htmlFor="supplier-status">Trạng thái:</label>
              <select id="supplier-status" aria-label="Trạng thái" value={status} onChange={(e)=>setStatus(e.target.value)}>
                <option value="">Tất cả</option><option>Đang hợp tác</option><option>Ngừng hợp tác</option>
              </select>
              <img src="/figma/002a0.svg" width="14" height="14" alt="" />
            </div>
          )}
          <Button type="submit" variant="primary">
            {kind !== "customers" && <img src={kind === "suppliers" ? "/figma/f5950.svg" : "/figma/bb29d.svg"} width="16" height="16" alt="" />}{kind === "customers" && <img src="/figma/cd5cf.svg" width="16" height="16" alt="" />}Tìm kiếm
          </Button>
        </form>
        {toolbar}
  </>;
  return (
    <>
      <h1>{c.title}</h1>
      <section className={"card" + (kind === "products" ? " product-list-card" : kind === "suppliers" ? " product-list-card supplier-list-card" : " customer-list-card")}>
        {kind === "customers" ? <><h2>Danh sách khách hàng</h2><div className="customer-list-controls">{controls}</div></> : controls}
        <Notice text={error} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>{c.code}</th>
                <th>{c.name}</th>
                {kind === "products" ? (
                  <>
                    <th>Danh mục</th>
                    <th>Đơn vị tính</th>
                    <th className="num">Giá nhập</th>
                    <th className="num">Giá bán</th>
                    <th className="num">Số lượng tồn</th>
                  </>
                ) : (
                  <>
                    {kind === "suppliers" && <th>Danh mục</th>}
                    <th>Số điện thoại</th>
                    {kind === "suppliers" && <th>Email</th>}
                    <th>Địa chỉ</th>
                    {kind === "suppliers" && <th>Trạng thái</th>}
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr
                  key={r.id}
                  className="clickable"
                  onClick={() => showDetail(r)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={"Chọn " + r.id}
                      checked={selected?.id === r.id}
                      onChange={() =>
                        setSelected(selected?.id === r.id ? null : r)
                      }
                      style={{ height: 16 }}
                    />
                  </td>
                  <td>
                    <button
                      className="btn link"
                      onClick={(e) => {
                        e.stopPropagation();
                        showDetail(r);
                      }}
                    >
                      {r.id}
                    </button>
                  </td>
                  <td>{r.name}</td>
                  {kind === "products" ? (
                    <>
                      <td>{r.category}</td>
                      <td>{r.base_unit}</td>
                      <td className="num">{money(r.average_cost)}</td>
                      <td className="num">{money(r.units[0]?.price)}</td>
                      <td className="num">{r.stock}</td>
                    </>
                  ) : (
                    <>
                      {kind === "suppliers" && <td>{r.categories.join(", ") || "—"}</td>}
                      <td>{r.phone}</td>
                      {kind === "suppliers" && <td>{r.email || "—"}</td>}
                      <td>{r.address || "—"}</td>
                      {kind === "suppliers" && (
                        <>
                          <td>
                            <Badge
                              tone={r.status === "Đang hợp tác" ? "green" : "red"}
                            >
                              {r.status}
                            </Badge>
                          </td>
                        </>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && !error && <Empty text={c.empty} />}
        <div className="table-footer">
          Hiển thị {rows.length ? 1 : 0}–{rows.length} / {rows.length}{" "}
          {c.singular}
        </div>
      </section>
      {form && (
        <MasterForm kind={kind} item={form} onClose={() => setForm(null)} />
      )}
      {price && <PriceForm product={price} onClose={() => setPrice(null)} />}
      {detail && (
        <Modal
          title={"Thông tin " + c.singular}
          wide
          onClose={() => setDetail(null)}
        >
          <div className="detail-meta">
            <div>
              <small>{c.code}</small>
              {detail.id}
            </div>
            <div>
              <small>{c.name}</small>
              {detail.name}
            </div>
            {kind === "products" ? (
              <>
                <div>
                  <small>Danh mục</small>
                  {detail.category}
                </div>
                <div>
                  <small>Mã vạch</small>
                  {detail.barcode || "—"}
                </div>
                <div>
                  <small>Giá nhập</small>
                  {money(detail.average_cost)}
                </div>
                <div>
                  <small>Số lượng tồn</small>
                  {detail.stock} {detail.base_unit}
                </div>
                <div>
                  <small>Mức tồn tối thiểu</small>
                  {detail.min_stock}
                </div>
                <div>
                  <small>Có quản lý hạn sử dụng</small>
                  {detail.expiry_managed ? "Có" : "Không"}
                </div>
              </>
            ) : (
              <>
                <div>
                  <small>Số điện thoại</small>
                  {detail.phone}
                </div>
                <div>
                  <small>Địa chỉ</small>
                  {detail.address || "—"}
                </div>
                {kind === "suppliers" && (
                  <>
                    <div>
                      <small>Email</small>
                      {detail.email || "—"}
                    </div>
                    <div>
                      <small>Trạng thái</small>
                      {detail.status}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          {kind === "products" && (
            <>
              <h3>Danh sách đơn vị bán</h3>
              <table>
                <thead>
                  <tr>
                    <th>Đơn vị</th>
                    <th className="num">Tỷ lệ quy đổi</th>
                    <th className="num">Giá bán</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.units.map((u: any) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td className="num">{u.factor}</td>
                      <td className="num">{money(u.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <h3 style={{ marginTop: 24 }}>Lịch sử thay đổi giá bán</h3>
              {detail.price_history.length ? (
                <table>
                  <thead>
                    <tr>
                      <th>Đơn vị</th>
                      <th>Giá cũ</th>
                      <th>Giá mới</th>
                      <th>Thời điểm thay đổi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.price_history.map((h: any) => (
                      <tr key={h.id}>
                        <td>{h.unit_name}</td>
                        <td>{money(h.old_price)}</td>
                        <td>{money(h.new_price)}</td>
                        <td>{datetime(h.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Empty text="Chưa có lịch sử thay đổi giá bán" />
              )}
            </>
          )}
          {kind === "customers" && (
            <>
              <h3>Lịch sử mua hàng</h3>
              {detail.invoices?.length ? (
                <table>
                  <thead>
                    <tr>
                      <th>Mã hóa đơn</th>
                      <th>Ngày giờ bán</th>
                      <th className="num">Tổng tiền</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.invoices.map((i: any) => (
                      <tr key={i.id}>
                        <td>{i.id}</td>
                        <td>{datetime(i.created_at)}</td>
                        <td className="num">{money(i.total)}</td>
                        <td>{i.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Empty text="Chưa có lịch sử mua hàng" />
              )}
            </>
          )}
          <div className="actions">
            <Button onClick={() => setDetail(null)}>Đóng</Button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function MasterForm({ kind, item, onClose, onSaved }: any) {
  const { data, refresh, notify, confirm } = useApp();
  const c = config[kind];
  const initial =
    kind === "products"
      ? {
          id: item.id,
          name: item.name || "",
          category_id: item.category_id || "",
          base_unit: item.base_unit || "",
          reference_cost: item.reference_cost || "",
          price: item.units?.[0]?.price || "",
          barcode: item.barcode || "",
          min_stock: item.min_stock ?? 0,
          expiry_managed: !!item.expiry_managed,
          description: item.description || "",
          units: [],
        }
      : {
          id: item.id,
          name: item.name || "",
          phone: item.phone || "",
          email: item.email || "",
          address: item.address || "",
          description: item.description || "",
          status: item.status || "Đang hợp tác",
          category_ids: item.category_ids || [],
          other: false,
          new_category: "",
        };
  const f = useForm(initial);
  const changed = JSON.stringify(initial) !== JSON.stringify(f.form);
  function cancel() {
    let msg = "Bạn có chắc chắn muốn hủy không?";
    if (kind === "products" && !item.id) {
      onClose();
      return;
    }
    if (kind === "customers")
      msg = item.id
        ? "Bạn có chắc chắn muốn hủy sửa khách hàng không?"
        : "Bạn có chắc chắn muốn hủy thêm khách hàng không?";
    if (changed) confirm(msg, onClose);
    else onClose();
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (f.busy) return;
    f.setBusy(true);
    try {
      const r = await api("action", { action: "save-" + kind, ...f.form });
      await refresh();
      notify(r.message);
      onSaved?.({ ...f.form, id: r.id });
      onClose();
    } catch (e: any) {
      f.caught(e);
    } finally {
      f.setBusy(false);
    }
  }
  return (
    <Modal
      title={(item.id ? "Sửa " : "Thêm ") + c.singular}
      onClose={cancel}
      wide={kind === "products"}
    >
      <form onSubmit={save}>
        <Notice
          text={f.error && Object.keys(f.errors).length === 0 ? f.error : ""}
        />
        <div className="grid-2">
          {item.id && <Field label={c.code} value={item.id} readOnly />}
          {kind !== "customers" && !item.id && (
            <Field label={c.code} value="Tự động tạo" readOnly />
          )}
          <Field
            label={c.name}
            required
            value={f.form.name}
            onChange={(e: any) => f.set("name", e.target.value)}
            error={f.errors.name}
          />
          {kind === "products" ? (
            <>
              <Field label="Danh mục" required error={f.errors.category_id}>
                <select
                  value={f.form.category_id}
                  onChange={(e) => f.set("category_id", e.target.value)}
                >
                  <option value="">Chọn danh mục</option>
                  {data.categories.map((x: any) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Đơn vị tính"
                required
                value={f.form.base_unit}
                onChange={(e: any) => f.set("base_unit", e.target.value)}
                error={f.errors.base_unit}
              />
              <Field
                label="Giá nhập"
                required
                inputMode="decimal"
                value={f.form.reference_cost}
                onChange={(e: any) => f.set("reference_cost", e.target.value)}
                error={f.errors.reference_cost}
              />
              <Field
                label="Giá bán"
                required
                inputMode="decimal"
                value={f.form.price}
                onChange={(e: any) => f.set("price", e.target.value)}
                error={f.errors.price}
                readOnly={!!item.id}
              />
              <Field
                label="Mã vạch"
                value={f.form.barcode}
                onChange={(e: any) => f.set("barcode", e.target.value)}
                error={f.errors.barcode}
              />
              <Field
                label="Mức tồn tối thiểu"
                inputMode="numeric"
                value={f.form.min_stock}
                onChange={(e: any) => f.set("min_stock", e.target.value)}
                error={f.errors.min_stock}
              />
              <label className="checkbox full">
                <input
                  type="checkbox"
                  checked={f.form.expiry_managed}
                  onChange={(e) => f.set("expiry_managed", e.target.checked)}
                />
                Có quản lý hạn sử dụng
              </label>
              {!item.id && (
                <div className="full">
                  <h3>Danh sách đơn vị bán</h3>
                  <p className="muted small">
                    Đơn vị tính là đơn vị cơ sở, tỷ lệ quy đổi bằng 1.
                  </p>
                  {f.form.units.map((u: any, index: number) => (
                    <div className="units" key={index}>
                      {[
                        ["name", "Đơn vị"],
                        ["factor", "Tỷ lệ quy đổi về đơn vị cơ sở"],
                        ["price", "Giá bán"],
                      ].map(([k, l]) => (
                        <Field
                          key={k}
                          label={l}
                          value={u[k]}
                          onChange={(e: any) =>
                            f.set(
                              "units",
                              f.form.units.map((x: any, i: number) =>
                                i === index ? { ...x, [k]: e.target.value } : x,
                              ),
                            )
                          }
                        />
                      ))}
                      <Button
                        variant="danger tiny"
                        onClick={() =>
                          f.set(
                            "units",
                            f.form.units.filter(
                              (_: any, i: number) => i !== index,
                            ),
                          )
                        }
                      >
                        Xóa
                      </Button>
                    </div>
                  ))}
                  <Notice text={f.errors.units} />
                  <Button
                    onClick={() =>
                      f.set("units", [
                        ...f.form.units,
                        { name: "", factor: "", price: "" },
                      ])
                    }
                  >
                    Thêm đơn vị bán
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <Field
                label="Số điện thoại"
                required
                value={f.form.phone}
                onChange={(e: any) => f.set("phone", e.target.value)}
                error={f.errors.phone}
              />
              {kind === "suppliers" && (
                <Field
                  label="Email"
                  value={f.form.email}
                  onChange={(e: any) => f.set("email", e.target.value)}
                  error={f.errors.email}
                />
              )}
              <div className="full">
                <Field
                  label="Địa chỉ"
                  value={f.form.address}
                  onChange={(e: any) => f.set("address", e.target.value)}
                />
              </div>
              {kind === "suppliers" && (
                <>
                  <div className="full">
                    <h3>Danh mục</h3>
                    <div className="row" style={{ flexWrap: "wrap" }}>
                      {data.categories.map((cat: any) => (
                        <label className="checkbox" key={cat.id}>
                          <input
                            type="checkbox"
                            checked={f.form.category_ids.includes(cat.id)}
                            onChange={(e) =>
                              f.set(
                                "category_ids",
                                e.target.checked
                                  ? [...f.form.category_ids, cat.id]
                                  : f.form.category_ids.filter(
                                      (id: number) => id !== cat.id,
                                    ),
                              )
                            }
                          />
                          {cat.name}
                        </label>
                      ))}
                      <label className="checkbox">
                        <input
                          type="checkbox"
                          checked={f.form.other}
                          onChange={(e) => f.set("other", e.target.checked)}
                        />
                        Khác
                      </label>
                    </div>
                    {f.form.other && (
                      <div style={{ marginTop: 16 }}>
                        <Field
                          label="Tên danh mục mới"
                          value={f.form.new_category}
                          onChange={(e: any) =>
                            f.set("new_category", e.target.value)
                          }
                          error={f.errors.new_category}
                        />
                      </div>
                    )}
                  </div>
                  {item.id && (
                    <Field label="Trạng thái" error={f.errors.status}>
                      <select
                        value={f.form.status}
                        onChange={(e) => f.set("status", e.target.value)}
                      >
                        <option>Đang hợp tác</option>
                        <option>Ngừng hợp tác</option>
                      </select>
                    </Field>
                  )}
                </>
              )}
            </>
          )}
          {kind !== "customers" && (
            <div className="full">
              <Field label="Mô tả">
                <textarea
                  value={f.form.description}
                  onChange={(e) => f.set("description", e.target.value)}
                />
              </Field>
            </div>
          )}
        </div>
        <div className="actions">
          <Button onClick={cancel}>Hủy</Button>
          <Button type="submit" variant="primary" disabled={f.busy}>
            Lưu
          </Button>
        </div>
      </form>
    </Modal>
  );
}
function PriceForm({ product, onClose }: any) {
  const { refresh, notify, confirm } = useApp();
  const f = useForm({ unit_id: product.units[0].id, price: "" });
  const unit = product.units.find((u: any) => u.id === Number(f.form.unit_id));
  function cancel() {
    if (f.form.price !== "")
      confirm("Bạn có chắc chắn muốn hủy cập nhật giá bán không?", onClose);
    else onClose();
  }
  async function save(confirmed = false) {
    f.setBusy(true);
    try {
      const r = await api("action", { action: "price", ...f.form, confirmed });
      if (r.warning) {
        confirm(r.warning, () => save(true), "Tiếp tục");
        return;
      }
      await refresh();
      notify(r.message);
      onClose();
    } catch (e: any) {
      f.caught(e);
    } finally {
      f.setBusy(false);
    }
  }
  return (
    <Modal title="Cập nhật giá bán" onClose={cancel}>
      <p>
        {product.id} · {product.name}
      </p>
      <Field label="Đơn vị bán">
        <select
          value={f.form.unit_id}
          onChange={(e) => f.set("unit_id", e.target.value)}
        >
          {product.units.map((u: any) => (
            <option value={u.id} key={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="summary row between" style={{ margin: "20px 0" }}>
        <span>Giá nhập: {money(product.average_cost * unit.factor)}</span>
        <span>Giá bán hiện tại: {money(unit.price)}</span>
      </div>
      <Notice text={f.error && !f.errors.price ? f.error : ""} />
      <Field
        label="Giá bán mới"
        value={f.form.price}
        onChange={(e: any) => f.set("price", e.target.value)}
        error={f.errors.price}
      />
      <div className="actions">
        <Button onClick={cancel}>Hủy</Button>
        <Button variant="primary" disabled={f.busy} onClick={() => save()}>
          Lưu
        </Button>
      </div>
    </Modal>
  );
}
