"use client";
import { useEffect, useState } from "react";
import { AppContext, api, Button, Field, Icon, Modal, Notice } from "./ui";
import Reports from "./reports";
import Sale from "./sale";
import SalesHistory from "./sales-history";
import { Inventory, Adjustments, Settings } from "./stock";
import Masters from "./masters";
import Receipts, { ReceiptHistory } from "./receipts";
import { date, today } from "@/lib/format";
const menus = [
  {
    icon: "sale",
    label: "Bán hàng",
    items: [
      ["sale", "Tạo giao dịch bán hàng"],
      ["cancel-invoice", "Hủy hóa đơn"],
      ["sales-history", "Tra cứu lịch sử bán hàng"],
      ["returns", "Xử lý đổi/trả hàng"],
    ],
  },
  {
    icon: "product",
    label: "Quản lý sản phẩm",
    items: [["products", "Quản lý sản phẩm"]],
  },
  {
    icon: "customer",
    label: "Quản lý khách hàng",
    items: [["customers", "Quản lý khách hàng"]],
  },
  {
    icon: "supplier",
    label: "Quản lý nhà cung cấp",
    items: [["suppliers", "Quản lý nhà cung cấp"]],
  },
  {
    icon: "stock",
    label: "Quản lý tồn kho",
    items: [
      ["receipts", "Nhập hàng"],
      ["adjustments", "Điều chỉnh tồn kho"],
      ["inventory", "Tra cứu tồn kho"],
      ["receipt-history", "Lịch sử nhập hàng"],
    ],
  },
  {
    icon: "report",
    label: "Báo cáo thống kê",
    items: [
      ["reports", "Báo cáo kinh doanh"],
      ["stock-report", "Báo cáo xuất – nhập – tồn"],
    ],
  },
];
export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({});
  const [view, setView] = useState("sale");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({sale:true});
  useEffect(() => {
    const menu = menus.find(m => m.items.some(([id]) => id === view));
    if(menu) setExpanded(old => ({...old,[menu.icon]:true}));
  }, [view]);
  const [toast, setToast] = useState("");
  const [confirmation, setConfirmation] = useState<any>(null);
  const [error, setError] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  async function refresh() {
    const d = await api("bootstrap");
    setData(d);
    return d;
  }
  useEffect(() => {
    setView(new URLSearchParams(location.search).get("view") || "sale");
    refresh()
      .then(() => setAuthenticated(true))
      .catch((e) => {
        if (e.status !== 401) setError(e.message);
      })
      .finally(() => setLoading(false));
    const h = () =>
      setView(new URLSearchParams(location.search).get("view") || "sale");
    window.addEventListener("popstate", h);
    return () => window.removeEventListener("popstate", h);
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 6500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  function navigate(next: string) {
    history.pushState({}, "", next === "sale" ? "/" : "/?view=" + next);
    setView(next);
  }
  function confirm(
    message: string,
    action: () => void,
    ok = "Xác nhận",
    cancel: string | string[] = "Quay lại",
  ) {
    setConfirmation({ message, action, ok, cancel });
  }
  async function signin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (!user.trim() || !password) {
        setError("Vui lòng nhập đầy đủ thông tin đăng nhập");
        return;
      }
      const simulateError = new URLSearchParams(location.search).get("demo") === "authError" && !sessionStorage.getItem("authErrorUsed");
      if (simulateError) sessionStorage.setItem("authErrorUsed", "1");
      await api("login", { username: user, password, simulateError });
      await refresh();
      setAuthenticated(true);
      navigate("sale");
    } catch (e: any) {
      setError(e.message === "Không thể tải dữ liệu" ? "Không thể đăng nhập. Vui lòng thử lại" : e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!authenticated)
    return (
      <div className="login-page" aria-busy={loading}>
        <form className="login-card" onSubmit={signin} noValidate>
          <h1>TẠP HÓA QUỲNH NHƯ</h1>
          <p className="login-subtitle">Đăng nhập để vào hệ thống bán hàng</p>
          <label className="login-label" htmlFor="login-user">Tên đăng nhập</label>
          <input id="login-user" placeholder="Nhập tên đăng nhập" value={user}
            className={error ? "login-invalid" : ""}
            aria-invalid={!!error} aria-describedby={error ? "login-error" : undefined}
            onChange={(e) => {setUser(e.target.value);setError("");}} autoComplete="username" />
          <label className="login-label password-label" htmlFor="login-password">Mật khẩu</label>
          <input id="login-password" placeholder="Nhập mật khẩu" value={password} type="password"
            className={error ? "login-invalid" : ""}
            aria-invalid={!!error} aria-describedby={error ? "login-error" : undefined}
            onChange={(e) => {setPassword(e.target.value);setError("");}} autoComplete="current-password" />
          <div id="login-error" className={`login-error${error ? " has-error" : ""}`} role={error ? "alert" : undefined}>{error}</div>
          <Button type="submit" variant="primary" disabled={busy || loading}>Đăng nhập</Button>
        </form>
      </div>
    );
  const context = { data, refresh, navigate, notify: setToast, confirm };
  return (
    <AppContext.Provider value={context}>
      <header className="header">
        <div className="brand">
          <Icon name="cart" />
          <div>
            <small>Tiệm tạp hóa</small>
            <strong>Quỳnh Như</strong>
          </div>
        </div>
        <form
          className="global-search"
          onSubmit={(e) => {
            e.preventDefault();
            navigate("sale");
            window.dispatchEvent(new Event("qn:search"));
          }}
        >
          <Icon name="search" />
          <input
            placeholder="Tìm kiếm/Quét mã vạch"
            aria-label="Tìm kiếm/Quét mã vạch"
            onChange={(e) =>
              sessionStorage.setItem("globalSearch", e.target.value)
            }
          />
        </form>
        <div className="header-right">
          <button
            aria-label="Cảnh báo tồn kho"
            onClick={() => navigate("inventory")}
          >
            <Icon name="bell" />
          </button>
          <button
            aria-label="Cài đặt demo"
            onClick={() => navigate("settings")}
          >
            <Icon name="user" />
            <Icon name="down" />
          </button>
        </div>
      </header>
      <aside className="sidebar">
        <nav>
          {menus.map((menu) => {
            const active = menu.items.some(([id]) => id === view);
            return (
              <div key={menu.icon} className="nav-group">
                <a
                  href={"/?view=" + menu.items[0][0]}
                  onClick={(e) => {
                    e.preventDefault();
                    if (view === menu.items[0][0] && menu.items.length > 1) setExpanded(old => ({...old, [menu.icon]: !old[menu.icon]}));
                    else {navigate(menu.items[0][0]);setExpanded(old => ({...old,[menu.icon]:true}));}
                  }}
                  className={"nav-item " + (active ? "active" : "")}
                >
                  <Icon name={menu.icon} />
                  <span>{menu.label}</span>
                  {menu.items.length > 1 && (
                    <span className="chevron" aria-hidden="true">
                      <Icon name="chevron" />
                    </span>
                  )}
                </a>
                {menu.items.length > 1 && expanded[menu.icon] && (
                  <div className="subnav">
                    {menu.items.filter(([id]) => id !== "sale").map(([id, name]) => (
                      <a
                        key={id}
                        href={"/?view=" + id}
                        className={id === view ? "selected" : ""}
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(id);
                        }}
                      >
                        {name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={() => navigate("settings")}>
            ⚙ <span>Cài đặt demo</span>
          </button>
          <button
            onClick={async () => {
              await api("logout", {});
              setAuthenticated(false);
              setUser("");
              setPassword("");
            }}
          >
            <Icon name="logout" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>
      <main className="main">
        {["products", "suppliers", "customers"].includes(view) ? (
          <Masters key={view} kind={view} />
        ) : view === "receipts" ? (
          <Receipts />
        ) : view === "receipt-history" ? (
          <ReceiptHistory />
        ) : view === "reports" || view === "stock-report" ? (
          <Reports key={view} stock={view === "stock-report"} />
        ) : view === "inventory" ? (
          <Inventory />
        ) : view === "adjustments" ? (
          <Adjustments />
        ) : view === "settings" ? (
          <Settings />
        ) : view === "sales-history" ||
          view === "cancel-invoice" ||
          view === "returns" ? (
          <SalesHistory
            key={view}
            operation={
              view === "cancel-invoice"
                ? "cancel"
                : view === "returns"
                  ? "return"
                  : "history"
            }
          />
        ) : (
          <Sale />
        )}
      </main>
      {toast && (
        <div className="toast" role="status">
          <span aria-hidden="true">✓ </span>
          <span>{toast}</span>
        </div>
      )}
      {confirmation && (
        <Modal title="Xác nhận" onClose={() => setConfirmation(null)}>
          <p className="confirm-text">{confirmation.message}</p>
          <div className="actions">
            {(Array.isArray(confirmation.cancel)
              ? confirmation.cancel
              : [confirmation.cancel]
            ).map((label: string) => (
              <Button key={label} onClick={() => setConfirmation(null)}>
                {label}
              </Button>
            ))}
            <Button
              variant="primary"
              onClick={() => {
                const c = confirmation;
                setConfirmation(null);
                c.action();
              }}
            >
              {confirmation.ok}
            </Button>
          </div>
        </Modal>
      )}
    </AppContext.Provider>
  );
}
