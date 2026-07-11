/**
 * COMPOSANT STATISTIQUES
 */

import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { 
  UserOutlined, 
  BookOutlined, 
  AppstoreOutlined, 
  CheckCircleOutlined,
  TeamOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';

const StatsCards = ({ 
  totalProfesseurs = 0,
  totalCours = 0,
  totalGestions = 0,
  totalApplications = 0,
  totalEtudiants = 0,
  loading = false
}) => {
  const stats = [
    {
      title: 'Professeurs',
      value: totalProfesseurs,
      icon: <UserOutlined />,
      color: '#1890ff',
      prefix: '👨‍🏫'
    },
    {
      title: 'Cours',
      value: totalCours,
      icon: <BookOutlined />,
      color: '#52c41a',
      prefix: '📚'
    },
    {
      title: 'Gestion Applications',
      value: totalGestions,
      icon: <AppstoreOutlined />,
      color: '#faad14',
      prefix: '📋'
    },
    {
      title: 'Applications',
      value: totalApplications,
      icon: <CheckCircleOutlined />,
      color: '#722ed1',
      prefix: '✅'
    },
    {
      title: 'Étudiants concernés',
      value: totalEtudiants,
      icon: <TeamOutlined />,
      color: '#13c2c2',
      prefix: '🎓'
    },
  ];

  return (
    <Row gutter={[16, 16]}>
      {stats.map((stat, index) => (
        <Col xs={24} sm={12} lg={4} key={index}>
          <Card loading={loading}>
            <Statistic
              title={
                <span>
                  {stat.prefix} {stat.title}
                </span>
              }
              value={stat.value}
              prefix={stat.icon}
              valueStyle={{ color: stat.color }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default StatsCards;