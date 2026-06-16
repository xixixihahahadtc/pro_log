"use client";

import { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Input, InputNumber, TreeSelect, Popconfirm, message, Space, Typography } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import api from "@/lib/api";

const { Title } = Typography;

interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  sortOrder: number;
  children?: Category[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form] = Form.useForm();

  const fetchCategories = () => {
    setLoading(true);
    api.get("/api/v1/categories")
      .then((res) => {
        if (res.data.code === 200) setCategories(res.data.data || []);
      })
      .catch(() => message.error("加载失败"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const openAdd = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    form.setFieldsValue(cat);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await api.put(`/api/v1/categories/${editing.id}`, values);
        message.success("已更新");
      } else {
        await api.post("/api/v1/categories", values);
        message.success("已创建");
      }
      setModalOpen(false);
      fetchCategories();
    } catch { message.error("操作失败"); }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await api.delete(`/api/v1/categories/${id}`);
      if (res.data.code === 200) { message.success("已删除"); fetchCategories(); }
      else message.error(res.data.message || "删除失败");
    } catch { message.error("删除失败"); }
  };

  const buildTreeOptions = (nodes: Category[]): any[] =>
    nodes.map((n) => ({
      title: n.name,
      value: n.id,
      children: n.children ? buildTreeOptions(n.children) : undefined,
    }));

  const columns = [
    { title: "名称", dataIndex: "name", key: "name" },
    { title: "Slug", dataIndex: "slug", key: "slug" },
    { title: "排序", dataIndex: "sortOrder", key: "sortOrder", width: 80 },
    {
      title: "操作", key: "action", width: 180,
      render: (_: unknown, record: Category) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => openEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>分类管理</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增分类</Button>
      </div>
      <Table rowKey="id" columns={columns} dataSource={categories} loading={loading}
        defaultExpandAllRows pagination={false} />
      <Modal title={editing ? "编辑分类" : "新增分类"} open={modalOpen}
        onOk={handleSubmit} onCancel={() => setModalOpen(false)} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="slug" label="Slug" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="parentId" label="父分类">
            <TreeSelect allowClear placeholder="留空 = 顶级分类"
              treeData={buildTreeOptions(categories.filter((c) => c.id !== editing?.id))} />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序值" initialValue={0}>
            <InputNumber min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
