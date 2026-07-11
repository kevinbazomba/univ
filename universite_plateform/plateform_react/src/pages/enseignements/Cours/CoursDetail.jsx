/**
 * DÉTAIL D'UN COURS
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Descriptions, Button, Space, Tag, Spin, message, 
  Row, Col, Statistic, Divider, Tabs, Table 
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  DeleteOutlined,
  BookOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  UserOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { coursService, appliquerCoursService } from '../../../services/enseignements';

const { TabPane } = Tabs;

const CoursDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cours, setCours] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchData() {
    setLoading(true);
    try {
      const [coursData, appsData] = await Promise.all([
        coursService.getById(id),
        appliquerCoursService.getByCours(id)
      ]);
      setCours(coursData.data);
      setApplications(appsData.data);
    } catch (error) {
      console.error(error);
      message.error('Erreur lors du chargement des données');
      navigate('/enseignements/cours');
    } finally {
      setLoading(false);
    }
  
  }

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, [id]);

  async function handleDelete() {
    try {
      await coursService.delete(id);
      message.success('Cours supprimé avec succès');
      navigate('/enseignements/cours');
    } catch (error) {
      console.error(error);
      message.error('Erreur lors de la suppression');
    }
  
  }

  const applicationsColumns = [
    {
      title: 'Étudiant',
      key: 'etudiant',
      render: (_, record) => (
        <span>{record.etudiant_nom} {record.etudiant_prenom}</span>
      ),
    },
    {
      title: 'Gestion',
      dataIndex: 'gestion_titre',
      key: 'gestion_titre',
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
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!cours) return null;

  return (
    <div>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/enseignements/cours')}
        style={{ marginBottom: 16 }}
      >
        Retour
      </Button>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2>{cours.nom_cours}</h2>
            <Tag color="blue">{cours.code_cours}</Tag>
          </div>
          <Space>
            <Button 
              icon={<EditOutlined />} 
              onClick={() => navigate(`/enseignements/cours/modifier/${cours.id}`)}
              type="primary"
            >
              Modifier
            </Button>
            <Button 
              icon={<DeleteOutlined />} 
              danger
              onClick={handleDelete}
            >
              Supprimer
            </Button>
          </Space>
        </div>

        <Divider />

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={4}>
            <Statistic 
              title="Pondération" 
              value={cours.ponderation} 
              prefix={<BookOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Statistic 
              title="Points" 
              value={cours.points} 
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Statistic 
              title="Crédits" 
              value={`${cours.credit} ECTS`} 
              prefix={<CreditCardOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Statistic 
              title="Volume horaire" 
              value={`${cours.volume_horaire}h`} 
              prefix={<ClockCircleOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Statistic 
              title="Responsable" 
              value={`${cours.responsable_nom} ${cours.responsable_prenom}`} 
              prefix={<UserOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Statistic 
              title="Étudiants" 
              value={applications.length} 
            />
          </Col>
        </Row>

        <Divider />

        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Code">{cours.code_cours}</Descriptions.Item>
          <Descriptions.Item label="Nom">{cours.nom_cours}</Descriptions.Item>
          <Descriptions.Item label="Pondération">{cours.ponderation}</Descriptions.Item>
          <Descriptions.Item label="Points">{cours.points}</Descriptions.Item>
          <Descriptions.Item label="Crédits">{cours.credit} ECTS</Descriptions.Item>
          <Descriptions.Item label="Volume horaire">{cours.volume_horaire}h</Descriptions.Item>
          <Descriptions.Item label="Responsable">
            {cours.responsable_nom} {cours.responsable_prenom}
          </Descriptions.Item>
          <Descriptions.Item label="Date de création">
            {dayjs(cours.date_creation).format('DD/MM/YYYY HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>
            {cours.description || 'Aucune description'}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Tabs defaultActiveKey="1">
          <TabPane tab={`Étudiants inscrits (${applications.length})`} key="1">
            <Table
              columns={applicationsColumns}
              dataSource={applications}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default CoursDetail;
