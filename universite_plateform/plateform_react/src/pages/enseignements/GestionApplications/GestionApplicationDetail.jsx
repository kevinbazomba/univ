/**
 * DÉTAIL D'UNE GESTION D'APPLICATION
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Descriptions, Button, Space, Table, Tag, 
  message, Spin, Row, Col, Statistic, Popconfirm,
  Tabs, Divider, Alert
} from 'antd';
import { 
  ArrowLeftOutlined, 
  ReloadOutlined, 
  DeleteOutlined,
  UserOutlined,
  BookOutlined,
  CalendarOutlined,
  TeamOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { gestionApplicationService, appliquerCoursService } from '../../../services/enseignements';

const { TabPane } = Tabs;

const GestionApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [gestion, setGestion] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    fetchDetail();
    fetchApplications();
  }, [id]);

  async function fetchDetail() {
    setLoading(true);
    try {
      const response = await gestionApplicationService.getById(id);
      setGestion(response.data);
    } catch (error) {
      console.error(error);
      message.error('Erreur lors du chargement des détails');
      navigate('/enseignements/gestion-applications');
    } finally {
      setLoading(false);
    }
  
  }

  async function fetchApplications() {
    setLoadingApps(true);
    try {
      const response = await appliquerCoursService.getByGestion(id);
      setApplications(response.data);
    } catch (error) {
      console.error(error);
      message.error('Erreur lors du chargement des applications');
    } finally {
      setLoadingApps(false);
    }
  
  }

  async function handleReapply() {
    try {
      await gestionApplicationService.reapply(id);
      message.success('Cours réappliqué avec succès');
      fetchApplications();
    } catch (error) {
      console.error(error);
      message.error('Erreur lors de la réapplication');
    }
  
  }

  async function handleDelete() {
    try {
      await gestionApplicationService.delete(id);
      message.success('Gestion supprimée avec succès');
      navigate('/enseignements/gestion-applications');
    } catch (error) {
      console.error(error);
      message.error('Erreur lors de la suppression');
    }
  
  }

  async function handleToggleActive(appId) {
    try {
      await appliquerCoursService.toggleActive(appId);
      fetchApplications();
    } catch (error) {
      console.error(error);
      message.error('Erreur lors du changement de statut');
    }
  
  }

  const columns = [
    {
      title: 'Matricule',
      dataIndex: 'etudiant_matricule',
      key: 'matricule',
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
      key: 'cours',
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
        <Button 
          type={record.est_actif ? 'default' : 'primary'}
          onClick={() => handleToggleActive(record.id)}
        >
          {record.est_actif ? 'Désactiver' : 'Activer'}
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!gestion) return null;

  return (
    <div>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/enseignements/gestion-applications')}
        style={{ marginBottom: 16 }}
      >
        Retour
      </Button>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2>{gestion.titre}</h2>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleReapply}
              type="primary"
            >
              Réappliquer
            </Button>
            <Popconfirm
              title="Supprimer cette gestion et toutes ses applications ?"
              onConfirm={handleDelete}
              okText="Oui"
              cancelText="Non"
            >
              <Button icon={<DeleteOutlined />} danger>
                Supprimer tout
              </Button>
            </Popconfirm>
          </Space>
        </div>

        <Divider />

        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <Statistic 
              title="Étudiants concernés" 
              value={gestion.nombre_etudiants || 0} 
              prefix={<TeamOutlined />}
            />
          </Col>
          <Col xs={24} md={6}>
            <Statistic 
              title="Cours" 
              value={gestion.cours_nom || 'N/A'} 
              prefix={<BookOutlined />}
            />
          </Col>
          <Col xs={24} md={6}>
            <Statistic 
              title="Créateur" 
              value={`${gestion.createur_nom} ${gestion.createur_prenom}`}
              prefix={<UserOutlined />}
            />
          </Col>
          <Col xs={24} md={6}>
            <Statistic 
              title="Date de création" 
              value={dayjs(gestion.date_creation).format('DD/MM/YYYY HH:mm')}
              prefix={<CalendarOutlined />}
            />
          </Col>
        </Row>

        <Divider />

        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Titre">{gestion.titre}</Descriptions.Item>
          <Descriptions.Item label="Cours">{gestion.cours_nom}</Descriptions.Item>
          <Descriptions.Item label="Faculté">{gestion.faculte_nom || 'Toutes'}</Descriptions.Item>
          <Descriptions.Item label="Promotion">{gestion.promotion_nom || 'Toutes'}</Descriptions.Item>
          <Descriptions.Item label="Année Académique">{gestion.annee_academique_nom || 'N/A'}</Descriptions.Item>
          <Descriptions.Item label="Créateur">{gestion.createur_nom} {gestion.createur_prenom}</Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>{gestion.description || 'Aucune description'}</Descriptions.Item>
        </Descriptions>

        <Divider />

        <Tabs defaultActiveKey="1">
          <TabPane tab={`Applications (${applications.length})`} key="1">
            <Alert
              message="Suppression individuelle"
              description="Vous pouvez supprimer ou désactiver chaque application individuellement ici. Pour supprimer toutes les applications, utilisez le bouton 'Supprimer tout' ci-dessus."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table
              columns={columns}
              dataSource={applications}
              loading={loadingApps}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Informations" key="2">
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Code Cours">{gestion.cours_code || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Pondération">{gestion.cours_ponderation || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Points">{gestion.cours_points || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Crédits">{gestion.cours_credit || 'N/A'}</Descriptions.Item>
              <Descriptions.Item label="Volume horaire">{gestion.cours_volume_horaire || 'N/A'}</Descriptions.Item>
            </Descriptions>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default GestionApplicationDetail;