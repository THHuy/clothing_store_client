# 👔 Fashion Store - Hệ thống quản lý cửa hàng quần áo

Đây là một hệ thống quản lý cửa hàng quần áo được xây dựng với React + TypeScript + Vite và Ant Design.

## 🚀 Tính năng chính

### 👤 Dành cho khách hàng (Không cần đăng nhập)
- Xem danh sách sản phẩm với hình ảnh đẹp mắt
- Tìm kiếm và lọc sản phẩm theo danh mục, size, màu sắc, giá
- Xem chi tiết sản phẩm với thông tin đầy đủ
- Giao diện responsive, thân thiện trên mobile

### 🧑‍💼 Dành cho Admin/Quản lý (Yêu cầu đăng nhập)
- **Dashboard**: Thống kê tổng quan, doanh thu, sản phẩm bán chạy
- **Quản lý sản phẩm**: CRUD sản phẩm, quản lý biến thể (size, màu)
- **Quản lý kho**: Nhập/xuất kho, cảnh báo tồn kho thấp, lịch sử giao dịch
- **Báo cáo thống kê**: Doanh thu, hàng tồn kho, sản phẩm bán chạy
- **Quản lý tài khoản**: Tạo/sửa/xóa tài khoản admin và manager

## 🛠 Công nghệ sử dụng

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Ant Design 5
- **Routing**: React Router Dom v6
- **State Management**: React Context API + useReducer
- **Styling**: CSS-in-JS với Ant Design theming
- **Icons**: Ant Design Icons
- **Date handling**: Day.js

## 🎨 Màu sắc chủ đạo

- **Nền chính**: `#FAF3E0` (vàng nhạt), `#F5E6C8` (be giấy dó)
- **Màu nhấn**: `#D04925` (cam đất), `#1E4D40` (xanh rêu), `#A31E22` (đỏ son)
- **Chữ chính**: `#2B2B2B`
- **Chữ phụ**: `#6E6E6E`
- **Hover/CTA**: `#F28C28`

## 📦 Cài đặt và chạy dự án

### Yêu cầu hệ thống
- Node.js >= 16
- npm hoặc yarn

### Các bước cài đặt

1. **Clone repository**
```bash
git clone <repository-url>
cd clothing_store/client
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Chạy ở môi trường development**
```bash
npm run dev
```

4. **Build cho production**
```bash
npm run build
```

5. **Preview build**
```bash
npm run preview
```

## 🔐 Tài khoản demo

Để truy cập vào admin panel, sử dụng:
- **Username**: `admin`
- **Password**: `admin123`

## 📁 Cấu trúc dự án

```
src/
├── components/          # Component dùng chung
│   └── common/         # Component common
├── pages/              # Các trang chính
│   ├── customer/       # Trang dành cho khách hàng
│   ├── admin/          # Trang dành cho admin
│   └── auth/           # Trang đăng nhập
├── layouts/            # Layout components
├── contexts/           # React Context
├── types/              # TypeScript type definitions
├── config/             # Cấu hình (theme, constants)
└── App.tsx             # Component gốc
```

## 🌐 Route structure

### Public routes (không cần đăng nhập)
- `/` - Trang chủ hiển thị sản phẩm
- `/products/:id` - Chi tiết sản phẩm
- `/login` - Trang đăng nhập chung
- `/admin/login` - Trang đăng nhập admin

### Protected routes (cần đăng nhập admin)
- `/admin/dashboard` - Dashboard admin
- `/admin/products` - Quản lý sản phẩm
- `/admin/inventory` - Quản lý kho
- `/admin/reports` - Báo cáo thống kê
- `/admin/users` - Quản lý tài khoản

## 📱 Responsive Design

Website được thiết kế responsive, tối ưu cho:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🚀 Tính năng sắp tới

- [ ] Kết nối Backend API (Node.js + Express)
- [ ] Database integration (MySQL)
- [ ] Authentication với JWT
- [ ] Upload ảnh sản phẩm
- [ ] Xuất báo cáo PDF/Excel
- [ ] Notifications real-time
- [ ] Multi-language support

## 🤝 Đóng góp

Nếu bạn muốn đóng góp cho dự án, vui lòng:
1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Developed with ❤️ by Fashion Store Team

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
