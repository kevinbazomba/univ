/**
 * FORMULAIRE PROFESSEUR
 */

import { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Select, Switch, message, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { professeurService } from '../../../services/enseignements';

const { Option } = Select;

const ProfesseurForm = ({ 
  visible, 
  onCancel, 
  onSuccess, 
  initialData,
  facultes,
  grades,
  registrationMode = false,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && initialData) {
      form.setFieldsValue({
        ...initialData,
        date_embauche: initialData.date_embauche ? dayjs(initialData.date_embauche) : null,
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, initialData, form]);

  async function handleSubmit(values) {
    setLoading(true);
    try {
      const data = {
        ...values,
        date_embauche: values.date_embauche?.format('YYYY-MM-DD'),
      };

      if (registrationMode) {
        await professeurService.register(data);
        message.success('Inscription enregistrée. Votre compte attend l’activation de l’administration.');
      } else if (initialData) {
        await professeurService.update(initialData.id, data);
        message.success('Professeur modifié avec succès');
      } else {
        await professeurService.create(data);
        message.success('Professeur créé avec succès');
      }
      onSuccess?.();
      onCancel?.();
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
      title={registrationMode ? 'Inscription du corps enseignant' : (initialData ? 'Modifier le Professeur' : 'Nouveau Professeur')}
      open={visible}
      onCancel={onCancel}
      onOk={form.submit}
      confirmLoading={loading}
      width={800}
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              name="nom"
              label="Nom"
              rules={[{ required: true, message: 'Le nom est requis' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="prenom"
              label="Prénom"
              rules={[{ required: true, message: 'Le prénom est requis' }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'L\'email est requis' },
                { type: 'email', message: 'Email invalide' }
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="telephone"
              label="Téléphone"
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="date_embauche"
              label="Date d'embauche"
              rules={[{ required: true, message: 'La date d\'embauche est requise' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="grade"
              label="Grade"
              rules={[{ required: true, message: 'Le grade est requis' }]}
            >
              <Select placeholder="Sélectionner un grade">
                {grades?.map(g => (
                  <Option key={g.id} value={g.id}>{g.libelle}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="faculte"
              label="Faculté"
              rules={[{ required: true, message: 'La faculté est requise' }]}
            >
              <Select placeholder="Sélectionner une faculté">
                {facultes?.map(f => (
                  <Option key={f.id} value={f.id}>{f.nom}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="specialite"
          label="Spécialité"
        >
          <Input />
        </Form.Item>

        {!initialData && (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="mot_de_passe"
                label="Mot de passe"
                rules={[
                  { required: true, message: 'Le mot de passe est requis' },
                  { min: 8, message: 'Minimum 8 caractères' },
                ]}
              >
                <Input.Password />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="confirmer_mot_de_passe"
                label="Confirmer le mot de passe"
                dependencies={['mot_de_passe']}
                rules={[
                  { required: true, message: 'Confirmation requise' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('mot_de_passe') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject('Les mots de passe ne correspondent pas');
                    },
                  }),
                ]}
              >
                <Input.Password />
              </Form.Item>
            </Col>
          </Row>
        )}

        {!registrationMode && (
          <Form.Item
            name="est_actif"
            label="Compte actif"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

export default ProfesseurForm;
