import React, { useEffect, useState } from 'react';
import { 
  UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, 
  UploadOutlined, EnvironmentOutlined, UserAddOutlined, CloseOutlined 
} from '@ant-design/icons';
import { Button, DatePicker, Drawer, Form, Input, Select, Spin, Upload, Card, Divider, App, Checkbox } from 'antd';
import { auth, db, storage } from '@/lib/firebase';
import { setDoc, doc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';
import { setgetAgentDataChange } from '@/redux/slices/commonSlice';
import { TrsutData } from '@/lib/constentData';
import { useTranslations } from 'next-intl';

const { Option } = Select;

const indianStates = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", 
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", 
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", 
  "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", 
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const AddAgent = () => {
  const t = useTranslations('addAgent');

  const [isAgentDrawerVisible, setIsAgentDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [autoPassword, setAutoPassword] = useState('');
  const [isAutoPassword, setIsAutoPassword] = useState(true);
  const [fileList, setFileList] = useState([]);
  const [documentList, setDocumentList] = useState([]);
  const [signatureFileList, setSignatureFileList] = useState([]);
  const [sendEmail, setSendEmail] = useState(false);

  const { message: antMessage } = App.useApp();
  const dispatch = useDispatch();

  function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    return Array(12).fill().map(() => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  }

  useEffect(() => {
    if (isAutoPassword) {
      const pwd = generatePassword();
      setAutoPassword(pwd);
      form.setFieldsValue({ password: pwd });
    }
  }, [isAutoPassword]);

  const showAgentDrawer = () => {
    setIsAgentDrawerVisible(true);
    form.setFieldsValue({ dateJoin: dayjs() });
    const pwd = generatePassword();
    setAutoPassword(pwd);
    form.setFieldsValue({ password: pwd });
  };

  const closeAgentDrawer = () => {
    setIsAgentDrawerVisible(false);
    form.resetFields();
    setFileList([]);
    setDocumentList([]);
    setSignatureFileList([]);
    setIsAutoPassword(true);
    setSendEmail(true);
  };

  const uploadFile = async (uid, file, path) => {
    if (!file) return '';
    const storageRef = ref(storage, `agents/${uid}/${path}/${file.name}`);
    await uploadBytes(storageRef, file.originFileObj);
    return await getDownloadURL(storageRef);
  };

  const sendAgentCredentialsEmail = async (agentData, password) => {
    try {
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #78350f 0%, #92400e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
            .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #78350f; }
            .credential-row { margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 4px; }
            .label { font-weight: bold; color: #78350f; }
            .value { color: #1f2937; margin-left: 10px; }
            .password-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center; }
            .password { font-size: 24px; font-weight: bold; color: #92400e; letter-spacing: 2px; font-family: monospace; }
            .warning { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .button { background: #78350f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 ${t('emailTemplate.welcome')}</h1>
              <p>${t('emailTemplate.accountCreated')}</p>
            </div>
            <div class="content">
              <h2>${t('emailTemplate.hello').replace('{name}', agentData.displayName)}</h2>
              <p>${t('emailTemplate.excitedMessage')}</p>
              
              <div class="credentials">
                <h3 style="color: #78350f; margin-top: 0;">📋 ${t('emailTemplate.accountDetails')}</h3>
                
                <div class="credential-row">
                  <span class="label">👤 ${t('emailTemplate.name')}:</span>
                  <span class="value">${agentData.displayName}</span>
                </div>
                
                <div class="credential-row">
                  <span class="label">📧 ${t('emailTemplate.email')}:</span>
                  <span class="value">${agentData.email}</span>
                </div>
                
                <div class="credential-row">
                  <span class="label">📱 ${t('emailTemplate.phone')}:</span>
                  <span class="value">${agentData.phone}</span>
                </div>
                
                <div class="credential-row">
                  <span class="label">📅 ${t('emailTemplate.joinDate')}:</span>
                  <span class="value">${agentData.dateJoin}</span>
                </div>
                
                <div class="credential-row">
                  <span class="label">📍 ${t('emailTemplate.location')}:</span>
                  <span class="value">${agentData.city}, ${agentData.state} - ${agentData.pinCode}</span>
                </div>
              </div>

              <div class="password-box">
                <p style="margin: 0 0 10px 0; color: #92400e; font-weight: bold;">🔐 ${t('emailTemplate.loginPassword')}</p>
                <div class="password">${password}</div>
              </div>

              <div class="warning">
                <strong>⚠️ ${t('emailTemplate.securityNotice')}</strong>
                <ul style="margin: 10px 0;">
                  <li>${t('emailTemplate.securityTips')}</li>
                  <li>${t('emailTemplate.securityTips2')}</li>
                  <li>${t('emailTemplate.securityTips3')}</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="#" class="button">
                  ${t('emailTemplate.loginButton')} in Shree Semkari Seva App
                </a>
              </div>

              <p style="margin-top: 30px;">${t('emailTemplate.supportMessage')}</p>
              
              <p>${t('emailTemplate.bestRegards')},<br><strong>${TrsutData.name}</strong></p>
            </div>
            <div class="footer">
              <p>${t('emailTemplate.automatedMessage')}</p>
              <p>© ${new Date().getFullYear()} ${TrsutData.name}. ${t('emailTemplate.rightsReserved')}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
${t('emailTemplate.welcome')}

${t('emailTemplate.hello').replace('{name}', agentData.displayName)},

${t('emailTemplate.excitedMessage')}

${t('emailTemplate.name')}: ${agentData.displayName}
${t('emailTemplate.email')}: ${agentData.email}
${t('emailTemplate.phone')}: ${agentData.phone}
${t('emailTemplate.joinDate')}: ${agentData.dateJoin}
${t('emailTemplate.location')}: ${agentData.city}, ${agentData.state} - ${agentData.pinCode}

${t('emailTemplate.loginPassword')} ${password}

${t('emailTemplate.securityNotice')}
- ${t('emailTemplate.securityTips')}
- ${t('emailTemplate.securityTips2')}
- ${t('emailTemplate.securityTips3')}

${t('emailTemplate.loginButton')}: Shree Semkari Seva App

${t('emailTemplate.supportMessage')}

${t('emailTemplate.bestRegards')},
The Team
      `;

      const response = await fetch('/api/email-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: agentData.email,
          subject: `🎉 ${t('emailTemplate.welcome')} Your Agent Account Credentials`,
          htmlContent,
          textContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to send email');
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('No authenticated user found');

      const authToken = await currentUser.getIdToken();
      const adminUid = currentUser.uid;

      const checkResponse = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ action: 'checkEmail', email: values.email }),
      });

      const checkData = await checkResponse.json();
      if (checkData.exists) {
        antMessage.error(t('messages.emailExists'));
        setLoading(false);
        return;
      }

      const password = isAutoPassword ? autoPassword : values.password;

      const createResponse = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({
          action: 'create',
          email: values.email,
          password: password,
          OrgData: { role: 'agent', displayName: values.name, createdBy: adminUid }
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || t('messages.createFailed'));
      }

      const { user: userRecord } = await createResponse.json();
      const agentUid = userRecord.uid;

      let photoURL = '';
      let signatureURL = '';
      let documentURLs = [];

      if (fileList.length > 0) photoURL = await uploadFile(agentUid, fileList[0], 'photo');
      if (signatureFileList.length > 0) signatureURL = await uploadFile(agentUid, signatureFileList[0], 'signature');
      if (documentList.length > 0) {
        documentURLs = await Promise.all(documentList.map(file => uploadFile(agentUid, file, 'documents')));
      }

      const agentData = {
        uid: agentUid,
        email: values.email,
        displayName: values.name || '',
        phone: values.phone || '',
        dateJoin: values.dateJoin ? values.dateJoin.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
        address: values.address || '',
        city: values.city || '',
        state: values.state || '',
        pinCode: values.pinCode || '',
        photoURL: photoURL || '',
        signatureURL: signatureURL || '',
        documentURLs: documentURLs || [],
        createdAt: new Date(),
        createdBy: adminUid,
        active_flags: true,
        delete_flags: false,
        role: 'agent',
        status: 'active'
      };

      const agentRef = doc(collection(db, 'users', adminUid, 'agents'), agentUid);
      await setDoc(agentRef, agentData);

      dispatch(setgetAgentDataChange(true));

      if (sendEmail) {
        try {
          await sendAgentCredentialsEmail(agentData, password);
          antMessage.success(t('messages.createSuccess'));
        } catch (emailError) {
          console.error('Email error:', emailError);
          antMessage.warning(t('messages.emailFailed'));
        }
      } else {
        antMessage.success(t('messages.createSuccessNoEmail'));
      }

      antMessage.info({
        content: t('messages.passwordInfo').replace('{email}', values.email).replace('{password}', password),
        duration: 15
      });

      closeAgentDrawer();
    } catch (error) {
      console.error('Error creating agent:', error);
      dispatch(setgetAgentDataChange(false));
      antMessage.error(error.message || t('messages.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleUploadChange = ({ fileList }) => setFileList(fileList.slice(-1));
  const handleDocumentUploadChange = ({ fileList }) => setDocumentList(fileList.slice(-5));
  const handleSignatureUploadChange = ({ fileList }) => setSignatureFileList(fileList.slice(-1));

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setAutoPassword(newPassword);
    setIsAutoPassword(true);
    form.setFieldsValue({ password: newPassword });
  };

  const handleTogglePasswordMode = () => {
    setIsAutoPassword(!isAutoPassword);
    if (!isAutoPassword) {
      const pwd = generatePassword();
      setAutoPassword(pwd);
      form.setFieldsValue({ password: pwd });
    }
  };

  return (
    <div>
      <Button
        type="primary"
        size="medium"
        icon={<UserAddOutlined />}
        onClick={showAgentDrawer}
        className="shadow-md hover:shadow-lg transition-all duration-300 !bg-amber-900"
      >
        {t('title')}
      </Button>

      <Drawer
        title={
          <div className="flex items-center justify-between">
            <span className="text-xl font-semibold flex items-center gap-2">
              <UserAddOutlined />
              {t('title')}
            </span>
          </div>
        }
        placement="right"
        onClose={closeAgentDrawer}
        open={isAgentDrawerVisible}
        width={window.innerWidth < 768 ? '100%' : 720}
        maskClosable={false}
        destroyOnClose
        extra={<Button type="text" icon={<CloseOutlined />} onClick={closeAgentDrawer} />}
      >
        <div className="bg-gray-50 rounded-lg p-4">
          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center">
              <Spin size="large" />
              <p className="text-gray-600 mt-4 font-medium">{t('loadingMessage')}</p>
              <p className="text-gray-400 text-sm mt-2">{t('loadingSubMessage')}</p>
            </div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{ dateJoin: dayjs() }}
              className="space-y-4"
            >
              {/* Personal Information */}
              <Card title={t('personalInfo')} className="shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    name="name"
                    label={t('fullName')}
                    rules={[{ required: true, message: t('validations.fullNameRequired') }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder={t('fullNamePlaceholder')} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label={t('emailAddress')}
                    rules={[
                      { required: true, message: t('validations.emailRequired') },
                      { type: 'email', message: t('validations.emailValid') },
                      { max: 50, message: t('validations.emailMax') }
                    ]}
                  >
                    <Input prefix={<MailOutlined />} placeholder={t('emailPlaceholder')} size="large" />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label={t('phoneNumber')}
                    rules={[
                      { required: true, message: t('validations.phoneRequired') },
                      { pattern: /^[0-9]{10}$/, message: t('validations.phoneValid') }
                    ]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder={t('phonePlaceholder')} size="large" maxLength={10} />
                  </Form.Item>

                  <Form.Item
                    name="dateJoin"
                    label={t('dateJoined')}
                    rules={[{ required: true, message: t('validations.dateRequired') }]}
                  >
                    <DatePicker className="w-full" size="large" format="DD/MM/YYYY" />
                  </Form.Item>
                </div>
              </Card>

              {/* Address Information */}
              <Card title={t('addressDetails')} className="shadow-sm">
                <div className="grid grid-cols-1 gap-4">
                  <Form.Item
                    name="address"
                    label={t('streetAddress')}
                    rules={[{ required: true, message: t('validations.addressRequired') }]}
                  >
                    <Input.TextArea rows={2} placeholder={t('streetAddressPlaceholder')} size="large" />
                  </Form.Item>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Form.Item
                      name="city"
                      label={t('city')}
                      rules={[{ required: true, message: t('validations.cityRequired') }]}
                    >
                      <Input placeholder={t('cityPlaceholder')} size="large" />
                    </Form.Item>

                    <Form.Item
                      name="state"
                      label={t('state')}
                      rules={[{ required: true, message: t('validations.stateRequired') }]}
                    >
                      <Select
                        showSearch
                        placeholder={t('statePlaceholder')}
                        size="large"
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                          option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                      >
                        {indianStates.map((state) => (
                          <Option key={state} value={state}>{state}</Option>
                        ))}
                      </Select>
                    </Form.Item>

                    <Form.Item
                      name="pinCode"
                      label={t('pinCode')}
                      rules={[
                        { required: true, message: t('validations.pinCodeRequired') },
                        { pattern: /^[0-9]{6}$/, message: t('validations.pinCodeValid') }
                      ]}
                    >
                      <Input placeholder={t('pinCodePlaceholder')} size="large" maxLength={6} />
                    </Form.Item>
                  </div>
                </div>
              </Card>

              {/* Documents Upload */}
              <Card title={t('documentsAndMedia')} className="shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item name="photo" label={t('profilePhoto')}>
                    <Upload
                      listType="picture-card"
                      maxCount={1}
                      fileList={fileList}
                      onChange={handleUploadChange}
                      beforeUpload={() => false}
                      accept="image/*"
                    >
                      {fileList.length === 0 && (
                        <div className="text-center">
                          <UploadOutlined className="text-2xl" />
                          <div className="mt-2">{t('uploadPhoto')}</div>
                        </div>
                      )}
                    </Upload>
                  </Form.Item>

                  <Form.Item name="signature" label={t('signature')}>
                    <Upload
                      listType="picture-card"
                      maxCount={1}
                      fileList={signatureFileList}
                      onChange={handleSignatureUploadChange}
                      beforeUpload={() => false}
                      accept="image/*"
                    >
                      {signatureFileList.length === 0 && (
                        <div className="text-center">
                          <UploadOutlined className="text-2xl" />
                          <div className="mt-2">{t('uploadSignature')}</div>
                        </div>
                      )}
                    </Upload>
                  </Form.Item>

                  <Form.Item name="documents" label={t('idDocuments')} className="md:col-span-2">
                    <Upload
                      listType="picture"
                      maxCount={5}
                      multiple
                      fileList={documentList}
                      onChange={handleDocumentUploadChange}
                      beforeUpload={() => false}
                      accept="image/*,.pdf"
                    >
                      <Button icon={<UploadOutlined />} size="large" block>
                        {t('uploadDocuments')}
                      </Button>
                    </Upload>
                  </Form.Item>
                </div>
              </Card>

              {/* Password Section */}
              <Card title={t('accountSecurity')} className="shadow-sm">
                <Form.Item label={t('password')}>
                  <div className="space-y-3">
                    <Form.Item name="password" noStyle>
                      <Input.Password
                        prefix={<LockOutlined />}
                        disabled={isAutoPassword}
                        size="large"
                        placeholder={t('autoGeneratedPassword')}
                      />
                    </Form.Item>
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleGeneratePassword} disabled={!isAutoPassword}>
                        🔄 {t('generateNew')}
                      </Button>
                      <Button onClick={handleTogglePasswordMode}>
                        {isAutoPassword ? `✏️ ${t('manualEntry')}` : `🤖 ${t('autoGenerate')}`}
                      </Button>
                    </div>
                    {isAutoPassword && (
                      <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
                        <strong>Note:</strong> {t('passwordNote')}
                      </div>
                    )}
                  </div>
                </Form.Item>

                <Form.Item className="mt-4">
                  <Checkbox checked={sendEmail} onChange={(e) => setSendEmail(e.target.checked)}>
                    <span className="font-medium">📧 {t('sendCredentials')}</span>
                  </Checkbox>
                  <div className="text-xs text-gray-500 mt-1 ml-6">
                    {t('credentialsNote')}
                  </div>
                </Form.Item>
              </Card>

              <Divider />

              <Form.Item className="mb-0">
                <div className="flex gap-3">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    size="large"
                    icon={<UserAddOutlined />}
                    className="flex-1"
                  >
                    {t('createAgent')}
                  </Button>
                  <Button size="large" onClick={closeAgentDrawer}>
                    {t('cancel')}
                  </Button>
                </div>
              </Form.Item>
            </Form>
          )}
        </div>
      </Drawer>
    </div>
  );
};

export default AddAgent;