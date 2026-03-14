import { useNavigate } from "react-router-dom";
import { logout } from "../../services/api";

function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ padding: "50px", textAlign: "center", fontFamily: "sans-serif" }}>
      <h1>Chào mừng, {user.name || "khách"}!</h1>
      <p>Bạn đã đăng nhập thành công với vai trò: <strong>{user.role}</strong></p>
      <div style={{ marginTop: "30px" }}>
        <button 
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Đăng xuất
        </button>
      </div>
    </div>
  );
}

export default Home;
