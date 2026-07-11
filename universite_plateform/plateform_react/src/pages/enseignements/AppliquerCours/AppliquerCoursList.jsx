/**
 * LISTE DES APPLICATIONS DE COURS
 */

import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, message, Tag, 
  Card, Popconfirm, Select, Input
} from 'antd';
import { 
  DeleteOutlined, 
  SearchOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { 
  appliquerCoursService, 
  coursService,
  gestionApplicationService,
  anneeAcademiqueService,
} from '../../../services/enseignements';

const { Option } = Select;
const AppliquerCoursList = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [searchText, setSearchText] = useState('');
  const [cours, setCours] = useState([]);
  const [gestions, setGestions] = useState([]);
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
      const response = await appliquerCoursService.getAll(filters);
      setApplications(response.data);
    } catch (error) {
      console.error(error);
      message.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  
  }

  async function fetchFilterData() {
    try {
      const [coursData, gestionsData, anneesData] = await Promise.all([
        coursService.getAll(),
        gestionApplicationService.getAll(),
        anneeAcademiqueService.getAll(),
      ]);
      setCours(coursData.data);
      setGestions(gestionsData.data);
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
      await appliquerCoursService.delete(id);
      message.success('Application supprimée avec succès');
      fetchData();
    } catch (error) {
      console.error(error);
      message.error('Erreur lors de la suppression');
    }
  
  }

  async function handleToggleActive(id, currentStatus) {
    try {
      await appliquerCoursService.toggleActive(id);
      message.success(`Application ${currentStatus ? 'désactivée' : 'activée'}`);
      fetchData();
    } catch (error) {
      console.error(error);
      message.error('Erreur lors du changement de statut');
    }
  
  }

  const columns = [
    {
      title: 'Gestion',
      dataIndex: 'gestion_titre',
      key: 'gestion_titre',
      render: (text) => <Tag color="purple">{text}</Tag>,
    },
    {
      title: 'Étudiant',
      key: 'etudiant',
      render: (_, record) => (
        <span>{record.etudiant_nom} {record.etudiant_prenom}</span>
      ),
    },
    {
      title: 'Cours',
      dataIndex: 'cours_nom',
      key: 'cours_nom',
    },
    {
      title: 'Date application',
      dataIndex: 'date_application',
      key: 'date_application',
      render: (text) => dayjs(text).format('DD/MM/YYYY HH:mm'),
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
          {anneeModifiable && <Button 
            icon={record.est_actif ? <CloseOutlined /> : <CheckOutlined />}
            onClick={() => handleToggleActive(record.id, record.est_actif)}
            type={record.est_actif ? 'default' : 'primary'}
          >
            {record.est_actif ? 'Désactiver' : 'Activer'}
          </Button>}
          {anneeModifiable && <Popconfirm
            title="Supprimer cette application ?"
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

  const filteredData = applications.filter(item =>
    item.etudiant_nom?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.cours_nom?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.gestion_titre?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Card>
      <div className="table-header">
        <h2>Applications de Cours</h2>
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
            placeholder="Gestion"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, gestion: value })}
          >
            {gestions.map(g => (
              <Option key={g.id} value={g.id}>{g.titre}</Option>
            ))}
          </Select>
          <Select
            placeholder="Statut"
            style={{ width: 120 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, est_actif: value })}
          >
            <Option value="true">Actif</Option>
            <Option value="false">Inactif</Option>
          </Select>
          <Select
            placeholder="Année académique"
            style={{ width: 240 }}
            value={filters.annee_academique}
            onChange={(value) => setFilters({ ...filters, annee_academique: value })}
          >
            {annees.map((annee) => <Option key={annee.id} value={annee.id}>{annee.nom} ({annee.date_debut} — {annee.date_fin}){annee.est_active ? ' · Active' : ''}</Option>)}
          </Select>
        </Space>
      </div>

      {!anneeModifiable && filters.annee_academique && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">Année clôturée — consultation uniquement.</div>}

      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1000 }}
      />
    </Card>
  );
};

export default AppliquerCoursList;
