/**
 * LISTE DES COURS
 */

import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, message, Tag, 
  Input, Popconfirm, Card, Select 
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  EyeOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { coursService, professeurService } from '../../../services/enseignements';
import CoursForm from './CoursForm';
import TeachingSectionHeader from '../../../components/TeachingSectionHeader';

const { Option } = Select;

const CoursList = () => {
  const navigate = useNavigate();
  const [cours, setCours] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCours, setEditingCours] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filterResponsable, setFilterResponsable] = useState(null);

  useEffect(() => {
    fetchData();
  }, [filterResponsable]);

  async function fetchData() {
    setLoading(true);
    try {
      const [coursData, profsData] = await Promise.all([
        coursService.getAll({ responsable: filterResponsable }),
        professeurService.getAll({ est_actif: true })
      ]);
      setCours(coursData.data);
      setProfesseurs(profsData.data);
    } catch (error) {
      console.error(error);
      message.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  
  }

  async function handleDelete(id) {
    try {
      await coursService.delete(id);
      message.success('Cours supprimé avec succès');
      fetchData();
    } catch (error) {
      console.error(error);
      message.error('Erreur lors de la suppression');
    }
  
  }

  const columns = [
    {
      title: 'Code',
      dataIndex: 'code_cours',
      key: 'code_cours',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Nom du cours',
      dataIndex: 'nom_cours',
      key: 'nom_cours',
    },
    {
      title: 'Pondération',
      dataIndex: 'ponderation',
      key: 'ponderation',
      render: (text) => `${text}`,
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
    },
    {
      title: 'Crédits',
      dataIndex: 'credit',
      key: 'credit',
      render: (text) => `${text} ECTS`,
    },
    {
      title: 'Volume horaire',
      dataIndex: 'volume_horaire',
      key: 'volume_horaire',
      render: (text) => `${text}h`,
    },
    {
      title: 'Responsable',
      key: 'responsable',
      render: (_, record) => (
        <span>{record.responsable_nom} {record.responsable_prenom}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/enseignements/cours/${record.id}`)}
          />
          <Button 
            icon={<EditOutlined />} 
            onClick={() => {
              setEditingCours(record);
              setModalVisible(true);
            }}
          />
          <Popconfirm
            title="Supprimer ce cours ?"
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

  const filteredData = cours.filter(item =>
    item.nom_cours?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.code_cours?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/80 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
      <TeachingSectionHeader title="Catalogue des cours" description="Créez et organisez les unités d’enseignement et leurs responsables." />
    <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
      <div className="table-header mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">Cours enregistrés</h2><p className="mt-1 text-sm text-slate-500">{filteredData.length} cours disponible{filteredData.length > 1 ? 's' : ''}</p></div>
        <Space>
          <Input
            placeholder="Rechercher..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            placeholder="Responsable"
            style={{ width: 200 }}
            allowClear
            onChange={(value) => setFilterResponsable(value)}
          >
            {professeurs.map(p => (
              <Option key={p.id} value={p.id}>
                {p.nom} {p.prenom}
              </Option>
            ))}
          </Select>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingCours(null);
              setModalVisible(true);
            }}
          >
            Nouveau Cours
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

      <CoursForm
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingCours(null);
        }}
        onSuccess={fetchData}
        initialData={editingCours}
        professeurs={professeurs}
      />
    </Card>
      </div>
    </div>
  );
};

export default CoursList;
