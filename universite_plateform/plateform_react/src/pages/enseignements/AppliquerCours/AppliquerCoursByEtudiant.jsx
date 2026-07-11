/**
 * COURS D'UN ÉTUDIANT
 */

import { useState, useEffect } from 'react';
import { Card, Table, Tag, Spin, Select, message, Divider } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { appliquerCoursService } from '../../../services/enseignements';

const { Option } = Select;

const AppliquerCoursByEtudiant = ({ etudiantId, showHeader = true }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  async function fetchData() {
    if (!etudiantId) return;
    setLoading(true);
    try {
      const response = await appliquerCoursService.getByEtudiant(etudiantId);
      setApplications(response.data);
    } catch (error) {
      console.error(error);
      message.error('Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
    }
  
  }

  useEffect(() => {
    if (etudiantId) {
      void Promise.resolve().then(fetchData);
    }
  }, [etudiantId]);

  const filteredData = filterStatus === 'all' 
    ? applications 
    : applications.filter(app => app.est_actif === (filterStatus === 'active'));

  const columns = [
    {
      title: 'Code',
      dataIndex: 'cours_code',
      key: 'cours_code',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Cours',
      dataIndex: 'cours_nom',
      key: 'cours_nom',
    },
    {
      title: 'Crédits',
      dataIndex: 'cours_credit',
      key: 'cours_credit',
      render: (text) => `${text} ECTS`,
    },
    {
      title: 'Gestion',
      dataIndex: 'gestion_titre',
      key: 'gestion_titre',
    },
    {
      title: 'Date',
      dataIndex: 'date_application',
      key: 'date_application',
      render: (text) => new Date(text).toLocaleDateString('fr-FR'),
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

  if (!etudiantId) {
    return (
      <Card>
        <p>Sélectionnez un étudiant pour voir ses cours.</p>
      </Card>
    );
  }

  return (
    <Card>
      {showHeader && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>
              <BookOutlined /> Cours de l'étudiant
            </h3>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: 150 }}
            >
              <Option value="all">Tous</Option>
              <Option value="active">Actifs</Option>
              <Option value="inactive">Inactifs</Option>
            </Select>
          </div>
          <Divider />
        </>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 30 }}>
          <Spin size="large" />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <Tag color="blue">Total: {applications.length} cours</Tag>
            <Tag color="green">Actifs: {applications.filter(a => a.est_actif).length}</Tag>
            <Tag color="red">Inactifs: {applications.filter(a => !a.est_actif).length}</Tag>
          </div>

          <Table
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </>
      )}
    </Card>
  );
};

export default AppliquerCoursByEtudiant;
