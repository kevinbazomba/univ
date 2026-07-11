/**
 * CHANGER MOT DE PASSE
 */

import { useState } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { professeurService } from '../../../services/enseignements';

const ChangePassword = ({ visible, onCancel, professeur }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values) {
    setLoading(true);
    try {
      await professeurService.changePassword(
        professeur.id,
        values.ancien_mot_de_passe,
        values.nouveau_mot_de_passe,
        values.confirmer_mot_de_passe
      );
      message.success('Mot de passe changé avec succès');
      onCancel();
      form.resetFields();
    } catch (error) {
      console.error(error);
      message.error('Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  
  }

  return (
    <Modal
      title={`Changer le mot de passe - ${professeur?.nom} ${professeur?.prenom}`}
      open={visible}
      onCancel={onCancel}
      onOk={form.submit}
      confirmLoading={loading}
      width={500}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="ancien_mot_de_passe"
          label="Ancien mot de passe"
          rules={[{ required: true, message: "L'ancien mot de passe est requis" }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name="nouveau_mot_de_passe"
          label="Nouveau mot de passe"
          rules={[
            { required: true, message: 'Le nouveau mot de passe est requis' },
            { min: 8, message: 'Le mot de passe doit contenir au moins 8 caractères' }
          ]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item
          name="confirmer_mot_de_passe"
          label="Confirmer le mot de passe"
          dependencies={['nouveau_mot_de_passe']}
          rules={[
            { required: true, message: 'Confirmation requise' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('nouveau_mot_de_passe') === value) {
                  return Promise.resolve();
                }
                return Promise.reject('Les mots de passe ne correspondent pas');
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ChangePassword;