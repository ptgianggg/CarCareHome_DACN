# CarCareHome - Hệ thống đặt lịch chăm sóc xe trực tuyến

##  Giới thiệu
**CarCareHome** là một nền tỡng fullstack hiện đại giúp tối ưu hóa quy trình đặt lịch và quản lý dịch vụ chăm sóc xe. Project được thiết kế để giải quyết nhu cầu đặt lịch bảo dưỡng xe một cách thuận tiện cho khách hàng và quản lý vận hành chuyên nghiệp cho chủ cửa hàng.
##  Công nghệ sử dụng
### Website đặt lịch dịch vụ chăm sóc xe (CarCareHome)
- **Backend:** 
  - Framework: **Spring Boot 3.x**
  - Ngôn ngữ: Java 17
  - Bảo mật: Spring Security, JWT (JSON Web Token), Google OAuth2
  - Thư viện: Lombok, Java Mail Sender, Spring Data JPA
- **Frontend:** 
  - Framework: **ReactJS (Vite)**
  - UI/Component: Lucide React, React Hot Toast
  - Quản lý State & Routing: React Context API, React Router Dom
  - Communication: Axios
- **Database:** 
  - Hệ quản trị: **MySQL**

##  Tính năng chính
- **Người dùng (Customer):**
  - Đăng ký/Đăng nhập (Hỗ trợ Google OAuth2).
  - Xem danh sách dịch vụ, tìm kiếm và lọc theo danh mục.
  - Đặt lịch dịch vụ trực tuyến với tích hợp thanh toán **MoMo**.
  - Quản lý lịch sử đặt lịch (Hủy lịch, đánh giá dịch vụ).
  - Hệ thống điểm thưởng (Loyalty points) và đổi Voucher.
- **Nhân viên (Staff):**
  - Quản lý danh sách công việc được phân công.
  - Đăng ký nghỉ phép trực tuyến.
  - Cập nhật thông tin cá nhân.
- **Quản trị viên (Admin):**
  - Dashboard thống kê doanh thu và hoạt động.
  - Quản lý Dịch vụ, Danh mục, Voucher.
  - Quản lý Tài khoản (User, Staff, Admin).
  - Phê duyệt yêu cầu nghỉ phép của nhân viên.
  - Cấu hình hệ thống (Email, thanh toán, v.v.).

##  Kiến trúc
- **Kiến trúc:** Client-Server, RESTful API.
- **Phía Server:** Chia layer rõ ràng (Controller -> Service -> Repository -> Entity).
- **Phía Client:** Cấu trúc components tái sử dụng, phân tách Layout và Page.

##  Cách chạy project

###  Backend
1. Yêu cầu: **Java 17** trở lên và **MySQL**.
2. Tạo database trong MySQL: `CREATE DATABASE carcarehome;`.
3. Cấu hình thông tin kết nối (username, password) trong file:
   `backend/src/main/resources/application.properties`.
4. Chạy project bằng lệnh:
   ```bash
   mvn spring-boot:run
   ```

###  Frontend
1. Yêu cầu: **Node.js** (Phiên bản LTS).
2. Di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
3. Cài đặt dependencies:
   ```bash
   npm install
   ```
4. Cấu hình file `.env` với các API key cần thiết (Google Client ID, Backend URL).
5. Khởi chạy:
   ```bash
   npm run dev
   ```

##  Ghi chú
- Project được thực hiện nhằm mục đích học tập, thực hành xây dựng ứng dụng Fullstack và phục vụ làm Demo cho CV.
- Toàn bộ source code được tổ chức sạch sẽ, dễ dàng mở rộng và bảo trì.
