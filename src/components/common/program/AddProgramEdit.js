import React, { useState, useEffect } from 'react';
import { Button, Drawer, Form, Input, InputNumber, Select, Space, Card, Typography, App, Radio, message } from 'antd';
import { FiPlusCircle, FiTrash2, FiUser, FiMapPin, FiDollarSign, FiCalendar, FiTag, FiEdit2, FiSave } from 'react-icons/fi';
import { useAuth } from '@/lib/AuthProvider';
import { collection, addDoc, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { setgetMemberDataChange, setPrograms } from '@/redux/slices/commonSlice';
import { useDispatch, useSelector } from 'react-redux';

const { TextArea } = Input;
const { Title, Text } = Typography;

const AddProgramEdit = ({ program, mode = 'add', onSuccess, triggerButton = null, isDrawerOpen, setIsDrawerOpen }) => {
  const { message: antdMessage } = App.useApp();
  const [form] = Form.useForm();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const dispatch = useDispatch();
  const programList = useSelector((state) => state.data.programList);

  const locationGroupTypes = [
    { label: 'Group A', value: 'A' },
    { label: 'Group B', value: 'B' },
    { label: 'Group C', value: 'C' },
  ];

  const programCategories = [
    { label: 'Suraksha', value: 'isSuraksha' },
    { label: 'Mamera', value: 'isMamera' },
    { label: 'Vivah', value: 'isVivah' },
    { label: 'Other', value: 'isOther' },
  ];

  // Initialize form with program data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && program && isDrawerOpen) {
      // Set isSelected from program data (default to false if not exists)
      setIsSelected(program.isSelected || false);
      
      // Determine selected category
      let selectedCategoryValue = 'isOther';
      programCategories.forEach(cat => {
        if (program[cat.value]) {
          selectedCategoryValue = cat.value;
        }
      });
      setSelectedCategory(selectedCategoryValue);

      form.setFieldsValue({
        name: program.name,
        hiname: program.hiname,
        noteLine: program.noteLine || '',
        about: program.about,
        memberCount: program?.memberCount || 0,
        inactivemembercount: program?.inactivemembercount || 0,
        category: selectedCategoryValue,
        otherCategoryName: program.otherCategoryName || '',
        otherCategoryHindiName: program.otherCategoryHindiName || '',
        ageGroups: program.ageGroups || [],
        locationGroups: program.locationGroups || [],
      });
    } else if (mode === 'add' && isDrawerOpen) {
      // Reset form for add mode
      setIsSelected(false);
      setSelectedCategory(null);
      form.resetFields();
    }
  }, [mode, program, isDrawerOpen, form]);

  const handleSubmit = async (values) => {
    if (!user?.uid) {
      antdMessage.error("User not authenticated!");
      return;
    }
    
    setLoading(true);
    try {
      // Add unique id to each age group and location group if not exists
      const ageGroupsWithId = (values.ageGroups || []).map(group => ({
        ...group,
        id: group.id || (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2)
      }));
      
      const locationGroupsWithId = (values.locationGroups || []).map(group => ({
        ...group,
        id: group.id || (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2)
      }));

      // Create category flags based on selected category
      const categoryFlags = {
        isSuraksha: false,
        isMamera: false,
        isVivah: false,
        isOther: false,
      };
      
      // Set the selected category to true
      if (values.category) {
        categoryFlags[values.category] = true;
      }

      // Base data object
      const baseData = {
        name: values.name,
        hiname: values.hiname,
        noteLine: values.noteLine || '',
        about: values.about,
        ...categoryFlags,
        isSelected: isSelected,
        memberCount: parseInt(values?.memberCount) || 0,
        inactivemembercount: parseInt(values?.inactivemembercount) || 0,
        ageGroups: ageGroupsWithId,
        locationGroups: locationGroupsWithId,
        updatedAt: new Date(),
      };

      // Add other category fields if category is "Other"
      if (values.category === 'isOther') {
        baseData.otherCategoryName = values.otherCategoryName || '';
        baseData.otherCategoryHindiName = values.otherCategoryHindiName || '';
      }

      if (mode === 'add') {
        const programsRef = collection(db, "users", user.uid, "programs");
        await addDoc(programsRef, {
          ...baseData,
          createdAt: new Date(),
          createdBy: user.uid,
        });
        
        antdMessage.success('Program created successfully!');
      } else if (mode === 'edit' && program?.id) {
        const programRef = doc(db, "users", user.uid, "programs", program.id);
        await updateDoc(programRef, baseData);
        
        antdMessage.success('Program updated successfully!');
        
        // Update Redux store
        const updatedPrograms = programList.map((item) => {
          if (item.id === program.id) {
            return {
              ...item,
              ...baseData,
              id: program.id,
            };
          }
          return item;
        });
        dispatch(setPrograms(updatedPrograms));
      }
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      dispatch(setgetMemberDataChange(true));
      form.resetFields();
      setSelectedCategory(null);
      setIsDrawerOpen(false);
    } catch (error) {
      console.error(`Error ${mode === 'add' ? 'adding' : 'updating'} program:`, error);
      antdMessage.error(`Failed to ${mode === 'add' ? 'create' : 'update'} program.`);
    }
    setLoading(false);
  };

  const AgeGroupCard = ({ field, remove }) => (
    <Card 
      key={field.key}
      className="bg-white hover:shadow-md transition-all duration-200 border border-gray-200"
      extra={
        <Button
          type="text"
          icon={<FiTrash2 className="text-red-500 hover:text-red-600" />}
          onClick={() => remove(field.name)}
          className="hover:bg-red-50"
        />
      }
      title={
        <div className="flex items-center gap-2">
          <FiCalendar className="text-blue-500" />
          <Text strong>Age Group {field.name + 1}</Text>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-6">
        <Form.Item
          {...field}
          label="Start Age"
          name={[field.name, 'startAge']}
          rules={[{ required: true, message: 'Required' }]}
        >
          <InputNumber 
            placeholder="Start age" 
            className="w-full h-10" 
            min={0}
            max={100}
          />
        </Form.Item>
        <Form.Item
          {...field}
          label="End Age"
          name={[field.name, 'endAge']}
          rules={[{ required: true, message: 'Required' }]}
        >
          <InputNumber 
            placeholder="End age" 
            className="w-full h-10" 
            min={0}
            max={100}
          />
        </Form.Item>
        <Form.Item
          {...field}
          label={
            <div className="flex items-center gap-1">
              <FiDollarSign className="text-green-500" />
              <span>Joining Fee</span>
            </div>
          }
          name={[field.name, 'joinFee']}
          rules={[{ required: true, message: 'Required' }]}
        >
          <InputNumber 
            placeholder="Amount" 
            className="w-full h-10"
            prefix="₹"
            min={0}
          />
        </Form.Item>
        <Form.Item
          {...field}
          label={
            <div className="flex items-center gap-1">
              <FiDollarSign className="text-green-500" />
              <span>Pay Amount</span>
            </div>
          }
          name={[field.name, 'payAmount']}
          rules={[{ required: true, message: 'Required' }]}
        >
          <InputNumber 
            placeholder="Amount" 
            className="w-full h-10"
            prefix="₹"
            min={0}
          />
        </Form.Item>
      </div>
      {/* Hidden field for ID */}
      <Form.Item
        {...field}
        name={[field.name, 'id']}
        hidden
      >
        <Input type="hidden" />
      </Form.Item>
    </Card>
  );

  const LocationGroupCard = ({ field, remove }) => (
    <Card 
      key={field.key}
      className="bg-white hover:shadow-md transition-all duration-200 border border-gray-200"
      extra={
        <Button
          type="text"
          icon={<FiTrash2 className="text-red-500 hover:text-red-600" />}
          onClick={() => remove(field.name)}
          className="hover:bg-red-50"
        />
      }
      title={
        <div className="flex items-center gap-2">
          <FiMapPin className="text-purple-500" />
          <Text strong>Location Group {field.name + 1}</Text>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-6">
        <Form.Item
          {...field}
          label="Group Name"
          name={[field.name, 'groupName']}
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input 
            placeholder="Enter group name" 
            className="h-10 w-full"
            prefix={<FiUser className="text-gray-400" />}
          />
        </Form.Item>
        <Form.Item
          {...field}
          label="Location"
          name={[field.name, 'location']}
          rules={[{ required: true, message: 'Required' }]}
        >
          <Input 
            placeholder="Enter location" 
            className="h-10 w-full"
            prefix={<FiMapPin className="text-gray-400" />}
          />
        </Form.Item>
        <Form.Item
          {...field}
          label="Location Group"
          name={[field.name, 'groupType']}
          rules={[{ required: true, message: 'Required' }]}
          className="col-span-2"
        >
          <Select
            placeholder="Select group type"
            options={locationGroupTypes}
            className="h-10 w-full"
          />
        </Form.Item>
      </div>
      {/* Hidden field for ID */}
      <Form.Item
        {...field}
        name={[field.name, 'id']}
        hidden
      >
        <Input type="hidden" />
      </Form.Item>
    </Card>
  );

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    form.resetFields();
    setSelectedCategory(null);
  };

  return (
    <>
      <Drawer
        title={
          <div className="flex items-center gap-2">
            {mode === 'edit' ? <FiEdit2 className="text-blue-500" /> : <FiPlusCircle className="text-blue-500" />}
            <Title level={4} className="!mb-0">
              {mode === 'edit' ? 'Edit Program' : 'Create New Program'}
            </Title>
          </div>
        }
        placement="right"
        onClose={handleCloseDrawer}
        open={isDrawerOpen}
        width={600}
        className="custom-drawer"
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="h-full"
        >
          <div className="space-y-6 pb-20">
            {/* Basic Information */}
            <Card className="border border-gray-200">
              <Title level={5} className="!mb-4 flex items-center gap-2">
                <FiUser className="text-blue-500" />
                Basic Information
              </Title>
              <Space direction="vertical" className="w-full">
                <Form.Item
                  label="Program Name"
                  name="name"
                  rules={[{ required: true, message: 'Please enter program name' }]}
                >
                  <Input 
                    placeholder="Enter program name" 
                    className="h-10"
                  />
                </Form.Item>
                <Form.Item
                  label="Hindi Yojna Name"
                  name="hiname"
                  rules={[{ required: true, message: 'Please enter yojna name' }]}
                >
                  <Input 
                    placeholder="Enter hindi yojna name" 
                    className="h-10"
                  />
                </Form.Item>
                <Form.Item
                  label="Member Count"
                  name="memberCount"
                  rules={[{ required: false }]}
                >
                  <Input 
                    placeholder="Enter Member Count" 
                    className="h-10"
                  />
                </Form.Item>
                
                <Form.Item
                  label="InActive Member Count"
                  name="inactivemembercount"
                  rules={[{ required: false }]}
                >
                  <Input 
                    placeholder="Enter InActive Member Count" 
                    className="h-10"
                  />
                </Form.Item>
                <Form.Item
                  label="Certificate Note (Hindi)"
                  name="noteLine"
                  rules={[{ required: true, message: 'Please enter note' }]}
                >
                  <Input 
                    placeholder="Enter hindi note for certificate" 
                    className="h-10"
                  />
                </Form.Item>
                <Form.Item
                  label="About Program"
                  name="about"
                  rules={[{ required: true, message: 'Please enter program description' }]}
                >
                  <TextArea
                    placeholder="Enter program description"
                    rows={3}
                    className="resize-none"
                  />
                </Form.Item>

                {/* isSelected Field */}
                <Form.Item
                  label={
                    <div className="flex items-center gap-2">
                      <FiTag className="text-orange-500" />
                      <span>Set as Selected Program</span>
                    </div>
                  }
                  name="isSelected"
                >
                  <Radio.Group 
                    value={isSelected}
                    onChange={(e) => setIsSelected(e.target.value)}
                    className="w-full"
                  >
                    <Space direction="horizontal">
                      <Radio value={true}>Yes</Radio>
                      <Radio value={false}>No</Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>

                {/* Program Category */}
                <Form.Item
                  label={
                    <div className="flex items-center gap-2">
                      <FiTag className="text-orange-500" />
                      <span>Program Category</span>
                    </div>
                  }
                  name="category"
                  rules={[{ required: true, message: 'Please select a category' }]}
                >
                  <Radio.Group 
                    className="w-full"
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <Space direction="vertical" className="w-full">
                      {programCategories.map(cat => (
                        <Radio key={cat.value} value={cat.value}>
                          {cat.label}
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>
                </Form.Item>

                {/* Other Category Name Fields - Only show when "Other" is selected */}
                {selectedCategory === 'isOther' && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Text strong className="block mb-3 text-blue-700">
                      Other Category Details (Required)
                    </Text>
                    <Form.Item
                      label="Other Category Name (English)"
                      name="otherCategoryName"
                      rules={[
                        { required: true, message: 'Please enter other category name in English' },
                        { min: 2, message: 'Name must be at least 2 characters' },
                        { max: 50, message: 'Name cannot exceed 50 characters' }
                      ]}
                    >
                      <Input 
                        placeholder="Enter category name in English" 
                        className="h-10"
                      />
                    </Form.Item>
                    <Form.Item
                      label="Other Category Name (Hindi)"
                      name="otherCategoryHindiName"
                      rules={[
                        { required: true, message: 'Please enter other category name in Hindi' },
                        { min: 2, message: 'नाम कम से कम 2 अक्षर का होना चाहिए' },
                        { max: 50, message: 'नाम 50 अक्षरों से अधिक नहीं हो सकता' }
                      ]}
                    >
                      <Input 
                        placeholder="हिंदी में श्रेणी का नाम दर्ज करें" 
                        className="h-10"
                      />
                    </Form.Item>
                  </div>
                )}
              </Space>
            </Card>

            {/* Age Groups */}
            <Card className="border border-gray-200">
              <Title level={5} className="!mb-4 flex items-center gap-2">
                <FiCalendar className="text-blue-500" />
                Age Groups
              </Title>
              <Form.List name="ageGroups">
                {(fields, { add, remove }) => (
                  <div className="space-y-4">
                    {fields.map(field => (
                      <AgeGroupCard key={field.key} field={field} remove={remove} />
                    ))}
                    <Button 
                      type="dashed" 
                      onClick={() => add()} 
                      className="w-full h-12 flex items-center justify-center gap-2 !border-blue-200 hover:!border-blue-400"
                      icon={<FiPlusCircle />}
                    >
                      Add Age Group
                    </Button>
                  </div>
                )}
              </Form.List>
            </Card>

            {/* Location Groups */}
            <Card className="border border-gray-200">
              <Title level={5} className="!mb-4 flex items-center gap-2">
                <FiMapPin className="text-purple-500" />
                Location Groups
              </Title>
              <Form.List name="locationGroups">
                {(fields, { add, remove }) => (
                  <div className="space-y-4">
                    {fields.map(field => (
                      <LocationGroupCard key={field.key} field={field} remove={remove} />
                    ))}
                    <Button 
                      type="dashed" 
                      onClick={() => add()} 
                      className="w-full h-12 flex items-center justify-center gap-2 !border-purple-200 hover:!border-purple-400"
                      icon={<FiPlusCircle />}
                    >
                      Add Location Group
                    </Button>
                  </div>
                )}
              </Form.List>
            </Card>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
            <div className="flex justify-end gap-3">
              <Button
                onClick={handleCloseDrawer}
                className="hover:bg-gray-50 px-6"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                className="bg-blue-500 hover:bg-blue-600 px-6"
                loading={loading}
                icon={mode === 'edit' ? <FiSave /> : null}
              >
                {mode === 'edit' ? 'Update Program' : 'Create Program'}
              </Button>
            </div>
          </div>
        </Form>
      </Drawer>
    </>
  );
};

export default AddProgramEdit;