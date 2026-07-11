/**
 * LISTE DES GRADES
 */

import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, message, Tag, 
  Input, Popconfirm, Card 
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined 
} from '@ant-design/icons';
import { gradeService } from '../../../services/enseignements';
import GradeForm from './GradeForm';
import TeachingSectionHeader from '../../../components/TeachingSectionHeader';

const GradeList = () => {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGrade, setEditingGrade] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchGrades();
  }, []);

  async function fetchGrades() {
    setLoading(true);
    try {
      const response = await gradeService.getAll();
      setGrades(response.data);
    } catch (error) {
      console.error(error);
      message.error('Erreur lors du chargement des grades');
    } finally {
      setLoading(false);
    }
  
  }

  async function handleDelete(id) {
    try {
      await gradeService.delete(id);
      message.success('Grade supprimé avec succès');
      fetchGrades();
    } catch (error) {
      console.error(error);
      message.error('Erreur lors de la suppression');
    }
  
  }

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Libellé',
      dataIndex: 'libelle',
      key: 'libelle',
    },
    {
      title: 'Ordre',
      dataIndex: 'ordre',
      key: 'ordre',
    },
    {
      title: 'Statut',
      dataIndex: 'est_actif',
      key: 'est_actif',
      render: (est_actif) => (
        <Tag color={est_actif ? 'green' : 'red'}>
          {est_actif ? 'Actif' : 'Inactif'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => {
              setEditingGrade(record);
              setModalVisible(true);
            }}
          />
          <Popconfirm
            title="Supprimer ce grade ?"
            onConfirm={() => handleDelete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredData = grades.filter(item =>
    item.libelle?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.code?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/80 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1450px]">
      <TeachingSectionHeader title="Gestion des grades" description="Administrez la hiérarchie et les grades du corps enseignant." />
    <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
      <div className="table-header mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">Répertoire des grades</h2><p className="mt-1 text-sm text-slate-500">{filteredData.length} grade{filteredData.length > 1 ? 's' : ''} affiché{filteredData.length > 1 ? 's' : ''}</p></div>
        <Space>
          <Input
            placeholder="Rechercher..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingGrade(null);
              setModalVisible(true);
            }}
          >
            Nouveau Grade
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <GradeForm
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingGrade(null);
        }}
        onSuccess={fetchGrades}
        initialData={editingGrade}
      />
    </Card>
      </div>
    </div>
  );
};

export default GradeList;
