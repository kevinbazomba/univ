/**
 * FORMULAIRE COURS
 */

import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, message, Row, Col } from 'antd';
import { coursService } from '../../../services/enseignements';

const { Option } = Select;
const { TextArea } = Input;

const CoursForm = ({ visible, onCancel, onSuccess, initialData, professeurs }) => {
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
        await coursService.update(initialData.id, values);
        message.success('Cours modifié avec succès');
      } else {
        await coursService.create(values);
        message.success('Cours créé avec succès');
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
      title={initialData ? 'Modifier le Cours' : 'Nouveau Cours'}
      open={visible}
      onCancel={onCancel}
      onOk={form.submit}
      confirmLoading={loading}
      width={800}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="nom_cours"
          label="Nom du cours"
          rules={[{ required: true, message: 'Le nom du cours est requis' }]}
        >
          <Input />
        </Form.Item>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="ponderation"
              label="Pondération"
              rules={[{ required: true, message: 'La pondération est requise' }]}
            >
              <InputNumber 
                min={0} 
                step={0.5} 
                style={{ width: '100%' }} 
                placeholder="Ex: 3.0"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="points"
              label="Points"
              rules={[{ required: true, message: 'Les points sont requis' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="credit"
              label="Crédits ECTS"
              rules={[{ required: true, message: 'Les crédits sont requis' }]}
            >
              <InputNumber 
                min={0} 
                step={0.5} 
                style={{ width: '100%' }} 
                placeholder="Ex: 3.0"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="volume_horaire"
          label="Volume horaire (heures)"
          rules={[{ required: true, message: 'Le volume horaire est requis' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="responsable"
          label="Responsable du cours"
          rules={[{ required: true, message: 'Le responsable est requis' }]}
        >
          <Select placeholder="Sélectionner un professeur">
            {professeurs?.map(p => (
              <Option key={p.id} value={p.id}>
                {p.nom} {p.prenom} ({p.matricule})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CoursForm;