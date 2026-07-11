/**
 * DÉTAIL D'UN GRADE
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Space, Tag, Spin, message, Row, Col, Statistic } from 'antd';
import { ArrowLeftOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { gradeService } from '../../../services/enseignements';

const GradeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [grade, setGrade] = useState(null);
  const [loading, setLoading] = useState(true);

  async function fetchGrade() {
    setLoading(true);
    try {
      const response = await gradeService.getById(id);
      setGrade(response.data);
    } catch (error) {
      console.error(error);
      message.error('Erreur lors du chargement du grade');
      navigate('/enseignements/grades');
    } finally {
      setLoading(false);
    }
  
  }

  useEffect(() => {
    void Promise.resolve().then(fetchGrade);
  }, [id]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!grade) return null;

  return (
    <div>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/enseignements/grades')}
        style={{ marginBottom: 16 }}
      >
        Retour
      </Button>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h2>Détail du Grade</h2>
          <Space>
            <Button 
              icon={<EditOutlined />} 
              onClick={() => navigate(`/enseignements/grades/modifier/${grade.id}`)}
              type="primary"
            >
              Modifier
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={8}>
            <Statistic 
              title="Code" 
              value={grade.code} 
              prefix={<Tag color="blue">{grade.code}</Tag>}
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic 
              title="Libellé" 
              value={grade.libelle} 
            />
          </Col>
          <Col xs={24} md={8}>
            <Statistic 
              title="Statut" 
              value={grade.est_actif ? 'Actif' : 'Inactif'} 
              prefix={grade.est_actif ? <CheckCircleOutlined style={{ color: 'green' }} /> : <CloseCircleOutlined style={{ color: 'red' }} />}
            />
          </Col>
        </Row>

        <Descriptions bordered column={2} style={{ marginTop: 24 }}>
          <Descriptions.Item label="Code">{grade.code}</Descriptions.Item>
          <Descriptions.Item label="Libellé">{grade.libelle}</Descriptions.Item>
          <Descriptions.Item label="Ordre">{grade.ordre || 0}</Descriptions.Item>
          <Descriptions.Item label="Statut">
            <Tag color={grade.est_actif ? 'green' : 'red'}>
              {grade.est_actif ? 'Actif' : 'Inactif'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Date de création">
            {dayjs(grade.date_creation).format('DD/MM/YYYY HH:mm')}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default GradeDetail;
