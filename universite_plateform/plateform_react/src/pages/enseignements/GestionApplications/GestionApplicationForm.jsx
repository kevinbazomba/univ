/**
 * FORMULAIRE GESTION APPLICATION
 */

import { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message, Row, Col, Divider, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { gestionApplicationService } from '../../../services/enseignements';

const { Option } = Select;
const { TextArea } = Input;

const GestionApplicationForm = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  initialData,
  cours,
  facultes,
  promotions,
  annees,
  professeurs
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      form.setFieldsValue(initialData);
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, initialData, form]);

  async function handleSubmit(values) {
    setLoading(true);
    try {
      if (initialData) {
        await gestionApplicationService.update(initialData.id, values);
        message.success('Gestion modifiée avec succès');
      } else {
        await gestionApplicationService.create(values);
        message.success('Gestion créée avec succès. Les cours ont été appliqués automatiquement.');
      }
      onSuccess();
      onCancel();
      form.resetFields();
    } catch (error) {
      console.error(error);
      message.error('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  
  }

  return (
    <Modal
      title={initialData ? 'Modifier la Gestion' : 'Nouvelle Gestion d\'Application'}
      open={visible}
      onCancel={onCancel}
      onOk={form.submit}
      confirmLoading={loading}
      width={700}
    >
      <Alert
        message="Information"
        description="Les cours seront automatiquement appliqués à tous les étudiants correspondant aux critères sélectionnés."
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="titre"
          label="Titre"
          rules={[{ required: true, message: 'Le titre est requis' }]}
        >
          <Input placeholder="Ex: Application Cours L1 Informatique" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea rows={3} placeholder="Description de l'application..." />
        </Form.Item>

        <Form.Item
          name="createur"
          label="Créateur"
          rules={[{ required: true, message: 'Le créateur est requis' }]}
        >
          <Select placeholder="Sélectionner un professeur">
            {professeurs?.map(p => (
              <Option key={p.id} value={p.id}>
                {p.nom} {p.prenom} ({p.matricule})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider>Critères de sélection des étudiants</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="faculte"
              label="Faculté"
            >
              <Select placeholder="Toutes les facultés" allowClear>
                {facultes?.map(f => (
                  <Option key={f.id} value={f.id}>{f.nom}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="promotion"
              label="Promotion"
            >
              <Select placeholder="Toutes les promotions" allowClear>
                {promotions?.map(p => (
                  <Option key={p.id} value={p.id}>{p.nom}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="annee_academique"
          label="Année Académique"
        >
          <Select placeholder="Sélectionner une année académique" allowClear>
            {annees?.map(a => (
              <Option key={a.id} value={a.id}>
                {a.nom} {a.est_active && '⭐'}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Divider>Cours à appliquer</Divider>

        <Form.Item
          name="cours"
          label="Cours"
          rules={[{ required: true, message: 'Le cours est requis' }]}
        >
          <Select placeholder="Sélectionner un cours">
            {cours?.map(c => (
              <Option key={c.id} value={c.id}>
                {c.code_cours} - {c.nom_cours} ({c.credit} crédits)
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default GestionApplicationForm;