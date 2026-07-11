/**
 * LISTE DES GESTIONS D'APPLICATION
 */

import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, message, Tag, 
  Card, Popconfirm, Select, Input 
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined,
  ReloadOutlined,
  DeleteOutlined as DeleteAllOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { 
  gestionApplicationService, 
  coursService, 
  professeurService,
  faculteService,
  promotionService,
  anneeAcademiqueService
} from '../../../services/enseignements';
import GestionApplicationForm from './GestionApplicationForm';
import TeachingSectionHeader from '../../../components/TeachingSectionHeader';

const { Option } = Select;
const GestionApplicationList = () => {
  const navigate = useNavigate();
  const [gestions, setGestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGestion, setEditingGestion] = useState(null);
  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  
  // Données pour les selects
  const [cours, setCours] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [facultes, setFacultes] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [annees, setAnnees] = useState([]);
  const anneeModifiable = Boolean(annees.find((annee) => String(annee.id) === String(filters.annee_academique))?.est_active);

  useEffect(() => {
    fetchData();
  }, [filters]);

  useEffect(() => {
    fetchFilterData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const response = await gestionApplicationService.getAll(filters);
      setGestions(response.data);
    } catch (error) {
      console.error(error);
      message.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  
  }

  async function fetchFilterData() {
    try {
      const [coursData, profsData, facsData, promsData, anneesData] = await Promise.all([
        coursService.getAll(),
        professeurService.getAll({ est_actif: true }),
        faculteService.getAll(),
        promotionService.getAll(),
        anneeAcademiqueService.getAll()
      ]);
      setCours(coursData.data);
      setProfesseurs(profsData.data);
      setFacultes(facsData.data);
      setPromotions(promsData.data);
      setAnnees(anneesData.data);
      const active = anneesData.data.find((annee) => annee.est_active) || anneesData.data[0];
      if (active) setFilters((courants) => ({ ...courants, annee_academique: active.id }));
    } catch (error) {
      console.error(error);
      console.error('Erreur chargement filtres:', error);
    }
  
  }

  async function handleDelete(id) {
    try {
      await gestionApplicationService.delete(id);
      message.success('Gestion supprimée avec succès');
      fetchData();
    } catch (error) {
      console.error(error);
      message.error('Erreur lors de la suppression');
    }
  
  }

  async function handleDeleteAllApplications(id) {
    try {
      await gestionApplicationService.deleteAllApplications(id);
      message.success('Toutes les applications ont été supprimées');
      fetchData();
    } catch (error) {
      console.error(error);
      message.error('Erreur lors de la suppression');
    }
  
  }

  async function handleReapply(id) {
    try {
      await gestionApplicationService.reapply(id);
      message.success('Cours réappliqué avec succès');
      fetchData();
    } catch (error) {
      console.error(error);
      message.error('Erreur lors de la réapplication');
    }
  
  }

  const columns = [
    {
      title: 'Titre',
      dataIndex: 'titre',
      key: 'titre',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: 'Cours',
      dataIndex: 'cours_nom',
      key: 'cours_nom',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Créateur',
      key: 'createur',
      render: (_, record) => (
        <span>{record.createur_nom} {record.createur_prenom}</span>
      ),
    },
    {
      title: 'Faculté',
      dataIndex: 'faculte_nom',
      key: 'faculte_nom',
      render: (text) => text || 'Toutes',
    },
    {
      title: 'Promotion',
      dataIndex: 'promotion_nom',
      key: 'promotion_nom',
      render: (text) => text || 'Toutes',
    },
    {
      title: 'Année Acad.',
      dataIndex: 'annee_academique_nom',
      key: 'annee_academique_nom',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Étudiants',
      key: 'nombre_etudiants',
      render: (_, record) => (
        <Tag color="green">{record.nombre_etudiants || 0}</Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date_creation',
      key: 'date_creation',
      render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => navigate(`/enseignements/gestion-applications/${record.id}`)}
          />
          {anneeModifiable && <Button 
            icon={<EditOutlined />} 
            onClick={() => {
              setEditingGestion(record);
              setModalVisible(true);
            }}
          />}
          {anneeModifiable && <Button 
            icon={<ReloadOutlined />} 
            onClick={() => handleReapply(record.id)}
            title="Réappliquer aux étudiants"
          />}
          {anneeModifiable && <Button 
            icon={<DeleteAllOutlined />} 
            danger
            onClick={() => handleDeleteAllApplications(record.id)}
            title="Supprimer toutes les applications"
          />}
          {anneeModifiable && <Popconfirm
            title="Supprimer cette gestion et toutes ses applications ?"
            onConfirm={() => handleDelete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>}
        </Space>
      ),
    },
  ];

  const filteredData = gestions.filter(item =>
    item.titre?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.cours_nom?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50/80 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1550px]">
      <TeachingSectionHeader title="Applications des cours" description="Planifiez et appliquez les cours aux facultés, promotions et étudiants." />
    <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
      <div className="table-header mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">Plans d’application</h2><p className="mt-1 text-sm text-slate-500">{filteredData.length} plan{filteredData.length > 1 ? 's' : ''} configuré{filteredData.length > 1 ? 's' : ''}</p></div>
        <Space wrap>
          <Input
            placeholder="Rechercher..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
          />
          <Select
            placeholder="Cours"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, cours: value })}
          >
            {cours.map(c => (
              <Option key={c.id} value={c.id}>{c.nom_cours}</Option>
            ))}
          </Select>
          <Select
            placeholder="Faculté"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, faculte: value })}
          >
            {facultes.map(f => (
              <Option key={f.id} value={f.id}>{f.nom}</Option>
            ))}
          </Select>
          <Select
            placeholder="Promotion"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, promotion: value })}
          >
            {promotions.map(p => (
              <Option key={p.id} value={p.id}>{p.nom}</Option>
            ))}
          </Select>
          <Select
            placeholder="Année académique"
            style={{ width: 240 }}
            value={filters.annee_academique}
            onChange={(value) => setFilters({ ...filters, annee_academique: value })}
          >
            {annees.map((annee) => (
              <Option key={annee.id} value={annee.id}>{annee.nom} ({annee.date_debut} — {annee.date_fin}){annee.est_active ? ' · Active' : ''}</Option>
            ))}
          </Select>
          {anneeModifiable && <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingGestion(null);
              setModalVisible(true);
            }}
          >
            Nouvelle Application
          </Button>}
        </Space>
      </div>

      {!anneeModifiable && filters.annee_academique && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Année clôturée — consultation uniquement.</div>}

      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1200 }}
      />

      <GestionApplicationForm
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingGestion(null);
        }}
        onSuccess={fetchData}
        initialData={editingGestion}
        cours={cours}
        facultes={facultes}
        promotions={promotions}
        annees={annees}
        professeurs={professeurs}
      />
    </Card>
      </div>
    </div>
  );
};

export default GestionApplicationList;
