/**
 * DÉTAIL D'UN PROFESSEUR
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Descriptions, Button, Space, Tag, Spin, message, 
  Row, Col, Statistic, Avatar, Divider, Tabs, Table 
} from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  MailOutlined, 
  PhoneOutlined,
  UserOutlined,
  KeyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { professeurService, coursService, faculteService, gradeService } from '../../../services/enseignements';
import ChangePassword from './ChangePassword';
import ProfesseurForm from './ProfesseurForm';
import TeachingSectionHeader from '../../../components/TeachingSectionHeader';

const { TabPane } = Tabs;

const ProfesseurDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [professeur, setProfesseur] = useState(null);
  const [cours, setCours] = useState([]);
  const [facultes, setFacultes] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    setLoading(true);
    try {
      const [profs, coursData, facultesData, gradesData] = await Promise.all([
        professeurService.getById(id),
        coursService.getByResponsable(id),
        faculteService.getAll(),
        gradeService.getAll(),
      ]);
      setProfesseur(profs.data);
      setCours(coursData.data);
      setFacultes(facultesData.data || []);
      setGrades(gradesData.data || []);
    } catch (error) {
      console.error(error);
      message.error('Erreur lors du chargement des données');
      navigate('/enseignements/professeurs');
    } finally {
      setLoading(false);
    }
  
  }

  async function handleDelete() {
    if (!window.confirm('Voulez-vous vraiment supprimer ce professeur ?')) return;
    try {
      await professeurService.delete(id);
      message.success('Professeur supprimé avec succès');
      navigate('/enseignements/professeurs');
    } catch (error) {
      console.error(error);
      message.error('Erreur lors de la suppression');
    }
  
  }

  const coursColumns = [
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
  ];

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-50">
        <div className="text-center"><Spin size="large" /><p className="mt-4 text-sm text-slate-500">Chargement du profil...</p></div>
      </div>
    );
  }

  if (!professeur) return null;

  return (
    <div className="min-h-screen bg-slate-50/80 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
      <TeachingSectionHeader title={`${professeur.nom} ${professeur.prenom}`} description="Profil et activité académique du professeur." />
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/enseignements/professeurs')}
        style={{ marginBottom: 16 }}
      >
        Retour
      </Button>

      <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <Space>
            <Avatar size={72} icon={<UserOutlined />} className="bg-indigo-600" />
            <div>
              <h2 style={{ margin: 0 }}>{professeur.nom} {professeur.prenom}</h2>
              <Tag color="purple">{professeur.matricule}</Tag>
            </div>
          </Space>
          <Space>
            <Button 
              icon={<KeyOutlined />} 
              onClick={() => setPasswordModalVisible(true)}
            >
              Changer mot de passe
            </Button>
            <Button 
              icon={<EditOutlined />} 
              onClick={() => setEditModalVisible(true)}
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
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="Email" 
              value={professeur.email} 
              prefix={<MailOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="Téléphone" 
              value={professeur.telephone || 'Non renseigné'} 
              prefix={<PhoneOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="Grade" 
              value={professeur.grade_libelle} 
              prefix={<Tag color="blue">{professeur.grade_code}</Tag>}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="Statut" 
              value={professeur.est_actif ? 'Actif' : 'Inactif'} 
              prefix={
                <Tag color={professeur.est_actif ? 'green' : 'red'}>
                  {professeur.est_actif ? 'Actif' : 'Inactif'}
                </Tag>
              }
            />
          </Col>
        </Row>

        <Divider />

        <Descriptions bordered column={2} size="small">
          <Descriptions.Item label="Matricule">{professeur.matricule}</Descriptions.Item>
          <Descriptions.Item label="Nom">{professeur.nom}</Descriptions.Item>
          <Descriptions.Item label="Prénom">{professeur.prenom}</Descriptions.Item>
          <Descriptions.Item label="Email">{professeur.email}</Descriptions.Item>
          <Descriptions.Item label="Téléphone">{professeur.telephone || 'Non renseigné'}</Descriptions.Item>
          <Descriptions.Item label="Faculté">{professeur.faculte_nom}</Descriptions.Item>
          <Descriptions.Item label="Grade">{professeur.grade_libelle}</Descriptions.Item>
          <Descriptions.Item label="Spécialité">{professeur.specialite || 'Non renseignée'}</Descriptions.Item>
          <Descriptions.Item label="Date d'embauche">
            {dayjs(professeur.date_embauche).format('DD/MM/YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Statut">
            <Tag color={professeur.est_actif ? 'green' : 'red'}>
              {professeur.est_actif ? 'Actif' : 'Inactif'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Dernière connexion">
            {professeur.date_derniere_connexion ? 
              dayjs(professeur.date_derniere_connexion).format('DD/MM/YYYY HH:mm') : 
              'Jamais'
            }
          </Descriptions.Item>
          <Descriptions.Item label="Date de création">
            {dayjs(professeur.date_creation).format('DD/MM/YYYY HH:mm')}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Tabs defaultActiveKey="1">
          <TabPane tab={`Cours enseignés (${cours.length})`} key="1">
            <Table
              columns={coursColumns}
              dataSource={cours}
              rowKey="id"
              pagination={false}
            />
          </TabPane>
          <TabPane tab="Informations de sécurité" key="2">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Tentatives de connexion">
                {professeur.tentative_connexion || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Compte bloqué">
                {professeur.bloque_jusqua ? 
                  `Bloqué jusqu'au ${dayjs(professeur.bloque_jusqua).format('DD/MM/YYYY HH:mm')}` : 
                  'Non bloqué'
                }
              </Descriptions.Item>
            </Descriptions>
          </TabPane>
        </Tabs>
      </Card>

      <ChangePassword
        visible={passwordModalVisible}
        onCancel={() => setPasswordModalVisible(false)}
        professeur={professeur}
      />
      <ProfesseurForm
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onSuccess={fetchData}
        initialData={professeur}
        facultes={facultes}
        grades={grades}
      />
      </div>
    </div>
  );
};

export default ProfesseurDetail;
