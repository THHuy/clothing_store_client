import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Typography,
  Avatar,
  Tooltip,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  LockOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import type { User } from '../../types';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useAuth } from '../../contexts/AuthContext';
import { usersAPI } from '../../services/api';

const { Title } = Typography;
const { Option } = Select;

const UserManagement: React.FC = () => {
  const { state: authState } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');

  // Kiểm tra quyền admin
  const isAdmin = authState.user?.role === 'ADMIN';
  
  // Nếu không phải admin, hiển thị thông báo từ chối quyền truy cập
  if (!isAdmin) {
    return (
      <div>
        <Card>
          <Alert
            message="Quyền truy cập bị từ chối"
            description="Bạn không có quyền truy cập vào trang quản lý tài khoản. Chỉ có Quản trị viên (Admin) mới có thể quản lý tài khoản người dùng."
            type="error"
            icon={<WarningOutlined />}
            showIcon
            style={{ margin: '50px 0' }}
          />
        </Card>
      </div>
    );
  }

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll();
      
      if (response.success) {
        setUsers(response.data || []);
      } else {
        message.error('Không thể tải danh sách tài khoản');
      }
    } catch (error: any) {
      console.error('Failed to load users:', error);
      message.error('Lỗi khi tải danh sách tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      ...user,
      password: '', // Don't show password
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const userToDelete = users.find(u => u.id === id);
      
      // Không cho phép xóa chính mình
      if (authState.user?.id === id) {
        message.error('Bạn không thể xóa tài khoản của chính mình!');
        return;
      }
      
      // Không cho phép xóa admin cuối cùng
      if (userToDelete?.role === 'ADMIN') {
        const adminCount = users.filter(u => u.role === 'ADMIN' && u.id !== id).length;
        if (adminCount === 0) {
          message.error('Không thể xóa admin cuối cùng trong hệ thống!');
          return;
        }
      }
      
      const response = await usersAPI.delete(id);
      
      if (response.success) {
        setUsers(users.filter(u => u.id !== id));
        message.success('Xóa tài khoản thành công!');
      } else {
        message.error(response.message || 'Có lỗi xảy ra khi xóa tài khoản!');
      }
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      message.error('Có lỗi xảy ra khi xóa tài khoản!');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await usersAPI.toggleStatus(id);
      
      if (response.success) {
        const updatedUsers = users.map(user =>
          user.id === id ? { ...user, isActive, updatedAt: new Date().toISOString() } : user
        );
        setUsers(updatedUsers);
        message.success(
          isActive ? 'Kích hoạt tài khoản thành công!' : 'Vô hiệu hóa tài khoản thành công!'
        );
      } else {
        message.error(response.message || 'Có lỗi xảy ra!');
      }
    } catch (error: any) {
      console.error('Failed to toggle user status:', error);
      message.error('Có lỗi xảy ra!');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingUser) {
        // Update user
        const updateData = { ...values };
        // Nếu không có password mới, xóa field password
        if (!updateData.password) {
          delete updateData.password;
        }
        
        const response = await usersAPI.update(editingUser.id, updateData);
        
        if (response.success) {
          // Reload users to get fresh data
          await loadUsers();
          message.success('Cập nhật tài khoản thành công!');
        } else {
          message.error(response.message || 'Có lỗi xảy ra khi cập nhật tài khoản!');
        }
      } else {
        // Create new user
        const response = await usersAPI.create(values);
        
        if (response.success) {
          // Reload users to get fresh data
          await loadUsers();
          message.success('Thêm tài khoản thành công!');
        } else {
          message.error(response.message || 'Có lỗi xảy ra khi thêm tài khoản!');
        }
      }
      
      setModalVisible(false);
      form.resetFields();
      setEditingUser(null);
    } catch (error: any) {
      console.error('Failed to submit user:', error);
      message.error('Có lỗi xảy ra!');
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchText.toLowerCase()) ||
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns: ColumnsType<User> = [
    {
      title: 'Avatar',
      key: 'avatar',
      width: 80,
      render: (_, record) => (
        <Avatar
          style={{ 
            backgroundColor: record.role === 'ADMIN' ? '#D04925' : '#1E4D40',
            color: 'white'
          }}
          icon={<UserOutlined />}
        >
          {record.username.charAt(0).toUpperCase()}
        </Avatar>
      ),
    },
    {
      title: 'Thông tin người dùng',
      key: 'userInfo',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.name}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            @{record.username} • ID: {record.id}
          </div>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      sorter: (a, b) => a.email.localeCompare(b.email),
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      width: 120,
      render: (role) => (
        <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>
          {role === 'ADMIN' ? 'Quản trị viên' : 'Quản lý'}
        </Tag>
      ),
      filters: [
        { text: 'Quản trị viên', value: 'ADMIN' },
        { text: 'Quản lý', value: 'MANAGER' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      width: 120,
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleActive(record.id, checked)}
          checkedChildren="Hoạt động"
          unCheckedChildren="Vô hiệu"
        />
      ),
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Vô hiệu hóa', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      width: 150,
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: 'Đăng nhập cuối',
      dataIndex: 'lastLogin',
      width: 150,
      render: (date) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : 'Chưa đăng nhập',
      sorter: (a, b) => {
        if (!a.lastLogin && !b.lastLogin) return 0;
        if (!a.lastLogin) return 1;
        if (!b.lastLogin) return -1;
        return dayjs(a.lastLogin).unix() - dayjs(b.lastLogin).unix();
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Chỉnh sửa">
            <Button
              icon={<EditOutlined />}
              size="small"
              type="primary"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Popconfirm
              title={
                record.id === authState.user?.id 
                  ? "Bạn không thể xóa tài khoản của chính mình!"
                  : record.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN').length === 1
                  ? "Không thể xóa admin cuối cùng trong hệ thống!"
                  : "Bạn có chắc chắn muốn xóa tài khoản này?"
              }
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
              disabled={
                record.id === authState.user?.id || 
                (record.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN').length === 1)
              }
            >
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
                disabled={
                  record.id === authState.user?.id || 
                  (record.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN').length === 1)
                }
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Security Notice */}
      <Alert
        message="Quản lý tài khoản hệ thống"
        description="Trang này chỉ dành cho Quản trị viên (Admin). Vui lòng cẩn thận khi thêm, sửa, xóa tài khoản. Chỉ có thể tạo tài khoản với vai trò Admin hoặc Manager."
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />
      
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Quản lý tài khoản
            </Title>
          </Col>
          <Col>
            <Space>
              <Input.Search
                placeholder="Tìm kiếm theo tên, tên đăng nhập hoặc email..."
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Thêm tài khoản
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredUsers.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} tài khoản`,
          }}
        />
      </Card>

      {/* Add/Edit User Modal */}
      <Modal
        title={editingUser ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tên đăng nhập"
                name="username"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
                  { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' },
                  { pattern: /^[a-zA-Z0-9_]+$/, message: 'Tên đăng nhập chỉ được chứa chữ, số và dấu _!' },
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="Nhập tên đăng nhập" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Họ và tên"
                name="name"
                rules={[
                  { required: true, message: 'Vui lòng nhập họ và tên!' },
                  { min: 2, message: 'Họ và tên phải có ít nhất 2 ký tự!' },
                ]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' },
                ]}
              >
                <Input placeholder="Nhập email" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Vai trò"
                name="role"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò!' }]}
              >
                <Select placeholder="Chọn vai trò">
                  <Option value="ADMIN">Quản trị viên</Option>
                  <Option value="MANAGER">Quản lý</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Trạng thái"
                name="isActive"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch
                  checkedChildren="Hoạt động"
                  unCheckedChildren="Vô hiệu"
                />
              </Form.Item>
            </Col>
          </Row>

          {!editingUser && (
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
            </Form.Item>
          )}

          {editingUser && (
            <Form.Item
              label="Mật khẩu mới (để trống nếu không đổi)"
              name="password"
              rules={[
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu mới" />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Cập nhật' : 'Thêm mới'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;
