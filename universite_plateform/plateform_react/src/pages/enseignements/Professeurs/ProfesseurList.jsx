/**
 * LISTE DES PROFESSEURS
 */

import { useState, useEffect } from 'react';
import { 
  Table, Button, Space, message, Tag, 
  Input, Popconfirm, Card, Select, Avatar 
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  EyeOutlined,
  KeyOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { professeurService, faculteService, gradeService } from '../../../services/enseignements';
import ProfesseurForm from './ProfesseurForm';
import ChangePassword from './ChangePassword';
import TeachingSectionHeader from '../../../components/TeachingSectionHeader';
import { Award, Building2, UserCheck, UsersRound } from 'lucide-react';

const { Option } = Select;

const ProfesseurList = () => {
  const navigate = useNavigate();
  const [professeurs, setProfesseurs] = useState([]);
  const [facultes, setFacultes] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editingProfesseur, setEditingProfesseur] = useState(null);
  const [selectedProfesseur, setSelectedProfesseur] = useState(null);
  const [filters, setFilters] = useState({});

  async function fetchData() {
    setLoading(true);
    try {
      // Récupérer les données
      const [profsRes, facsRes, grdsRes] = await Promise.all([
        professeurService.getAll(filters),
        faculteService.getAll(),
        gradeService.getAll()
      ]);
      
      // Vérifier et extraire les données correctement
      // Si votre API retourne { data: [...] } ou directement un tableau
      const profsData = profsRes?.data || profsRes || [];
      const facsData = facsRes?.data || facsRes || [];
      const grdsData = grdsRes?.data || grdsRes || [];
      
      console.log('Professeurs data:', profsData);
      console.log('Facultés data:', facsData);
      console.log('Grades data:', grdsData);
      
      setProfesseurs(Array.isArray(profsData) ? profsData : []);
      setFacultes(Array.isArray(facsData) ? facsData : []);
      setGrades(Array.isArray(grdsData) ? grdsData : []);
      
    } catch (error) {
      console.error(error);
      console.error('Erreur détaillée:', error);
      message.error('Erreur lors du chargement des données: ' + (error.message || ''));
      
      // Initialiser avec des tableaux vides en cas d'erreur
      setProfesseurs([]);
      setFacultes([]);
      setGrades([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(fetchData);
  }, [filters]);

  const handleDelete = async (id) => {
    try {
      await professeurService.delete(id);
      message.success('Professeur supprimé avec succès');
      fetchData();
    } catch (error) {
      console.error(error);
      message.error('Erreur lors de la suppression');
    }
  };

  // Vérifier si les données sont disponibles avant le rendu
  const columns = [
    {
      title: 'Matricule',
      dataIndex: 'matricule',
      key: 'matricule',
      render: (text) => text ? <Tag color="purple">{text}</Tag> : null,
    },
    {
      title: 'Nom complet',
      key: 'nom_complet',
      render: (_, record) => {
        const nom = record?.nom || 'N/A';
        const prenom = record?.prenom || '';
        return (
          <Space>
            <Avatar>{prenom?.[0] || '?'}{nom?.[0] || ''}</Avatar>
            <span>{nom} {prenom}</span>
          </Space>
        );
      },
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Grade',
      key: 'grade_libelle',
      render: (_, record) => {
        const gradeLibelle = record?.grade_libelle || record?.grade?.libelle || 'N/A';
        return <Tag color="blue">{gradeLibelle}</Tag>;
      },
    },
    {
      title: 'Faculté',
      key: 'faculte_nom',
      render: (_, record) => record?.faculte_nom || record?.faculte?.nom || 'N/A',
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
            icon={<EyeOutlined />} 
            title="Voir le profil"
            onClick={() => navigate(`/enseignements/professeurs/${record.id}`)}
          />
          <Button 
            icon={<EditOutlined />} 
            title="Modifier"
            onClick={() => {
              setEditingProfesseur(record);
              setModalVisible(true);
            }}
          />
          <Button 
            icon={<KeyOutlined />} 
            title="Changer le mot de passe"
            onClick={() => {
              setSelectedProfesseur(record);
              setPasswordModalVisible(true);
            }}
          />
          <Popconfirm
            title="Supprimer ce professeur ?"
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

  const professeursActifs = professeurs.filter((professeur) => professeur.est_actif).length;

  return (
    <div className="min-h-screen bg-slate-50/80 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
      <TeachingSectionHeader title="Corps enseignant" description="Gérez les profils, responsabilités et accès du personnel enseignant." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Professeurs', value: professeurs.length, icon: UsersRound, color: 'bg-indigo-600' },
          { label: 'Comptes actifs', value: professeursActifs, icon: UserCheck, color: 'bg-emerald-600' },
          { label: 'Facultés', value: facultes.length, icon: Building2, color: 'bg-sky-600' },
          { label: 'Grades', value: grades.length, icon: Award, color: 'bg-violet-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '—' : value}</p></div><div className={`rounded-2xl p-3 text-white ${color}`}><Icon className="h-6 w-6" /></div></div>
          </article>
        ))}
      </div>

    <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
      <div className="table-header mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div><h2 className="text-xl font-bold text-slate-900">Répertoire des professeurs</h2><p className="mt-1 text-sm text-slate-500">Recherchez, consultez ou mettez à jour un membre du corps enseignant.</p></div>
        <Space wrap>
          <Input
            placeholder="Rechercher..."
            prefix={<SearchOutlined />}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: 200 }}
          />
          <Select
            placeholder="Faculté"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, faculte: value })}
          >
            {Array.isArray(facultes) && facultes.map(f => (
              <Option key={f.id} value={f.id}>{f.nom || f.libelle || 'Sans nom'}</Option>
            ))}
          </Select>
          <Select
            placeholder="Grade"
            style={{ width: 150 }}
            allowClear
            onChange={(value) => setFilters({ ...filters, grade: value })}
          >
            {Array.isArray(grades) && grades.map(g => (
              <Option key={g.id} value={g.id}>{g.libelle || g.nom || 'Sans libellé'}</Option>
            ))}
          </Select>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProfesseur(null);
              setModalVisible(true);
            }}
          >
            Nouveau Professeur
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={Array.isArray(professeurs) ? professeurs : []}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        locale={{ emptyText: 'Aucun professeur trouvé' }}
      />

      <ProfesseurForm
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingProfesseur(null);
        }}
        onSuccess={fetchData}
        initialData={editingProfesseur}
        facultes={facultes}
        grades={grades}
      />

      <ChangePassword
        visible={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          setSelectedProfesseur(null);
        }}
        professeur={selectedProfesseur}
      />
    </Card>
      </div>
    </div>
  );
};

export default ProfesseurList;
