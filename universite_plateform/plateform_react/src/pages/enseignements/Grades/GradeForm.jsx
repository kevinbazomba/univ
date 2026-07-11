/**
 * FORMULAIRE GRADE
 */

import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Switch, message } from 'antd';
import { gradeService } from '../../../services/enseignements';

const GradeForm = ({ visible, onCancel, onSuccess, initialData }) => {
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
        await gradeService.update(initialData.id, values);
        message.success('Grade modifié avec succès');
      } else {
        await gradeService.create(values);
        message.success('Grade créé avec succès');
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
      title={initialData ? 'Modifier le Grade' : 'Nouveau Grade'}
      open={visible}
      onCancel={onCancel}
      onOk={form.submit}
      confirmLoading={loading}
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="libelle"
          label="Libellé"
          rules={[{ required: true, message: 'Le libellé est requis' }]}
        >
          <Input placeholder="Ex: Maître de conférences" />
        </Form.Item>

        <Form.Item
          name="ordre"
          label="Ordre"
          initialValue={0}
        >
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="est_actif"
          label="Actif"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default GradeForm;