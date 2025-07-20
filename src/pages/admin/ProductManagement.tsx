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
  InputNumber,
  Upload,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Typography,
  Image,
  Tooltip,
} from 'antd';
import PlusOutlined from '@ant-design/icons/es/icons/PlusOutlined';
import EditOutlined from '@ant-design/icons/es/icons/EditOutlined';
import DeleteOutlined from '@ant-design/icons/es/icons/DeleteOutlined';
import EyeOutlined from '@ant-design/icons/es/icons/EyeOutlined';
import UploadOutlined from '@ant-design/icons/es/icons/UploadOutlined';

import type { Product, ProductCategory } from '../../types';
import type { ColumnsType } from 'antd/es/table';
import { productsAPI, categoriesAPI } from '../../services/api';
import { getFirstImageUrl, handleImageError } from '../../utils/imageUtils';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ProductManagement: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(''); // '' = all, 'active' = active only, 'inactive' = inactive only

  useEffect(() => {
    // Load products and categories from API
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAllForAdmin();
      if (response.success) {
        setProducts(response.data);
      } else {
        message.error('Không thể tải danh sách sản phẩm');
      }
    } catch (error) {
      console.error('Error loading products:', error);
      message.error('Có lỗi xảy ra khi tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      if (response.success) {
        setCategories(response.data);
      } else {
        message.error('Không thể tải danh sách danh mục');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      message.error('Có lỗi xảy ra khi tải danh mục');
    }
  };

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      ...product,
      categoryId: product.category.id,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await productsAPI.delete(id);
      if (response.success) {
        setProducts(products.filter(p => p.id !== id));
        message.success('Xóa sản phẩm thành công!');
      } else {
        message.error(response.message || 'Lỗi khi xóa sản phẩm');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      message.error('Có lỗi xảy ra khi xóa sản phẩm!');
    }
  };

  const handleStatusToggle = async (id: string, currentStatus: boolean) => {
    try {
      const response = await productsAPI.updateStatus(id, !currentStatus);
      if (response.success) {
        // Update the product status in the local state
        setProducts(products.map(p => 
          p.id === id ? { ...p, isActive: !currentStatus } : p
        ));
        message.success(response.message || 'Cập nhật trạng thái thành công!');
      } else {
        message.error(response.message || 'Lỗi khi cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error updating product status:', error);
      message.error('Có lỗi xảy ra khi cập nhật trạng thái!');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Prepare FormData for file upload
      const formData = new FormData();
      formData.append('sku', values.sku);
      formData.append('name', values.name);
      formData.append('category_id', values.categoryId);
      formData.append('brand', values.brand);
      formData.append('material', values.material);
      formData.append('description', values.description);
      formData.append('purchase_price', values.purchasePrice);
      formData.append('sale_price', values.salePrice);
      formData.append('is_active', values.isActive ? '1' : '0');

      // Handle image uploads
      if (values.images && values.images.fileList) {
        values.images.fileList.forEach((file: any) => {
          if (file.originFileObj) {
            formData.append('images', file.originFileObj);
          }
        });
      }

      // Handle variants
      if (values.variants && values.variants.length > 0) {
        formData.append('variants', JSON.stringify(values.variants));
      }

      if (editingProduct) {
        // Update existing product
        formData.append('keepImages', 'true');
        
        const result = await productsAPI.updateWithFormData(editingProduct.id, formData);
        if (result.success) {
          message.success('Cập nhật sản phẩm thành công!');
          loadProducts();
        } else {
          message.error(result.message || 'Lỗi khi cập nhật sản phẩm');
        }
      } else {
        // Create new product
        const result = await productsAPI.createWithFormData(formData);
        if (result.success) {
          message.success('Thêm sản phẩm thành công!');
          loadProducts();
        } else {
          message.error(result.message || 'Lỗi khi tạo sản phẩm');
        }
      }
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error submitting product:', error);
      message.error('Có lỗi xảy ra!');
    }
  };


  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const filteredProducts = products.filter(product => {
    // Text search filter
    const matchesSearch = product.name.toLowerCase().includes(searchText.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchText.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchText.toLowerCase());
    
    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'active') {
      matchesStatus = product.isActive;
    } else if (statusFilter === 'inactive') {
      matchesStatus = !product.isActive;
    }
    
    return matchesSearch && matchesStatus;
  });

  const columns: ColumnsType<Product> = [
    {
      title: 'Ảnh',
      dataIndex: 'images',
      width: 80,
      render: (images) => (
        <Image
          src={getFirstImageUrl(images)}
          alt="Product"
          width={50}
          height={60}
          style={{ objectFit: 'cover', borderRadius: '4px' }}
          onError={handleImageError}
        />
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      width: 100,
      sorter: (a, b) => a.sku.localeCompare(b.sku),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            {record.description.substring(0, 50)}...
          </div>
        </div>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: ['category', 'name'],
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>,
      filters: categories.map(cat => ({ text: cat.name, value: cat.name })),
      onFilter: (value, record) => record.category.name === value,
    },
    {
      title: 'Thương hiệu',
      dataIndex: 'brand',
      width: 120,
      render: (text) => <Tag color="green">{text}</Tag>,
    },
    {
      title: 'Giá nhập',
      dataIndex: 'purchasePrice',
      width: 120,
      render: (price) => formatPrice(price),
      sorter: (a, b) => a.purchasePrice - b.purchasePrice,
    },
    {
      title: 'Giá bán',
      dataIndex: 'salePrice',
      width: 120,
      render: (price) => formatPrice(price),
      sorter: (a, b) => a.salePrice - b.salePrice,
    },
    {
      title: 'Tồn kho',
      key: 'stock',
      width: 100,
      render: (_, record) => {
        const totalStock = record.variants.reduce((sum, variant) => sum + variant.stock, 0);
        const color = totalStock > 20 ? 'green' : totalStock > 5 ? 'orange' : 'red';
        return <Tag color={color}>{totalStock}</Tag>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      width: 130,
      render: (isActive, record) => (
        <Space direction="vertical" size="small">
          <Switch
            checked={isActive}
            onChange={() => handleStatusToggle(record.id, isActive)}
            checkedChildren="Hoạt động"
            unCheckedChildren="Ngừng bán"
            loading={false}
          />
        </Space>
      ),
      filters: [
        { text: 'Hoạt động', value: true },
        { text: 'Ngừng bán', value: false },
      ],
      onFilter: (value, record) => record.isActive === value,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => window.open(`/products/${record.id}`, '_blank')}
            />
          </Tooltip>
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
              title="Bạn có chắc chắn muốn xóa sản phẩm này?"
              onConfirm={() => handleDelete(record.id)}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              Quản lý sản phẩm
            </Title>
          </Col>
          <Col>
            <Space>
              <Input.Search
                placeholder="Tìm kiếm sản phẩm..."
                allowClear
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
              />
              <Select
                placeholder="Lọc theo trạng thái"
                allowClear
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 150 }}
              >
                <Option value="">Tất cả</Option>
                <Option value="active">Hoạt động</Option>
                <Option value="inactive">Ngừng bán</Option>
              </Select>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Thêm sản phẩm
              </Button>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredProducts.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} của ${total} sản phẩm`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Add/Edit Product Modal */}
      <Modal
        title={editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Mã sản phẩm (SKU)"
                name="sku"
                rules={[{ required: true, message: 'Vui lòng nhập mã sản phẩm!' }]}
              >
                <Input placeholder="VD: AO001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Tên sản phẩm"
                name="name"
                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm!' }]}
              >
                <Input placeholder="Nhập tên sản phẩm" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Danh mục"
                name="categoryId"
                rules={[{ required: true, message: 'Vui lòng chọn danh mục!' }]}
              >
                <Select placeholder="Chọn danh mục">
                  {categories.map(cat => (
                    <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Thương hiệu"
                name="brand"
                rules={[{ required: true, message: 'Vui lòng nhập thương hiệu!' }]}
              >
                <Input placeholder="VD: Fashion Store" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Chất liệu"
            name="material"
            rules={[{ required: true, message: 'Vui lòng nhập chất liệu!' }]}
          >
            <Input placeholder="VD: Cotton 100%" />
          </Form.Item>

          <Form.Item
            label="Mô tả sản phẩm"
            name="description"
            rules={[{ required: true, message: 'Vui lòng nhập mô tả!' }]}
          >
            <TextArea rows={3} placeholder="Nhập mô tả chi tiết sản phẩm" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Giá nhập"
                name="purchasePrice"
                rules={[{ required: true, message: 'Vui lòng nhập giá nhập!' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Giá bán"
                name="salePrice"
                rules={[{ required: true, message: 'Vui lòng nhập giá bán!' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="0"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Trạng thái"
            name="isActive"
            initialValue={true}
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select placeholder="Chọn trạng thái">
              <Option value={true}>Hoạt động</Option>
              <Option value={false}>Ngừng bán</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Ảnh sản phẩm" name="images">
            <Upload
              listType="picture-card"
              multiple
              beforeUpload={() => false}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingProduct ? 'Cập nhật' : 'Thêm mới'}
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

export default ProductManagement;
