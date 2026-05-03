'use client'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AgGridReact } from 'ag-grid-react';
import { 
    ClientSideRowModelModule,
    ModuleRegistry,
    NumberEditorModule,
    NumberFilterModule,
    PaginationModule,
    RowSelectionModule,
    TextEditorModule,
    TextFilterModule,
    ValidationModule,
    RowStyleModule
} from 'ag-grid-community';
import { EyeOutlined, EditOutlined, PlusCircleOutlined } from '@ant-design/icons';
import { MdOutlinePendingActions } from "react-icons/md";
import { GrCertificate } from 'react-icons/gr';
import { Avatar, Button, Dropdown, Tag, Tooltip, Select, Space } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { getData } from '@/lib/services/firebaseService';
import { useAuth } from '@/lib/AuthProvider';
import { BsThreeDots } from 'react-icons/bs';
import MemberDetailsView from '../MemberDetailsView';
import EditMember from '../EditMember';
import MemberCertificateCom from '../MemberCertificates';
import { FaFile } from 'react-icons/fa';
import MemberRegForm from '../MemberRegForm';
import { setgetMemberDataChange } from '@/redux/slices/commonSlice';
import ClosingForm from './ClosingForm';
import { fetchSingleMemberMarriageReport, getAgentMemberPaystatus } from '@/lib/helper';
import MemberPaymentDetails from './MemberPaymentDetails';
import { useTranslations } from 'next-intl';

const { Option } = Select;

ModuleRegistry.registerModules([
    NumberEditorModule,
    TextEditorModule,
    TextFilterModule,
    NumberFilterModule,
    RowSelectionModule,
    PaginationModule,
    ClientSideRowModelModule,
    ValidationModule,
    RowStyleModule
]);

const MemberList = () => {
    const t = useTranslations('memberList');

    const [allMembersData, setAllMembersData] = useState([]);
    const [filteredMembersData, setFilteredMembersData] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [isDetailsView, setIsDetailsView] = useState(false);
    const [isEditmemberOpen, setIsEditmemberOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isOpenRegModal, setIsOpenRegModal] = useState(false);
    const [isOpenClosingForm, setIsOpenClosingForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('active');
    const [genderFilter, setGenderFilter] = useState('all');
    const [isPaymentDetailsOpen, setIsPaymentDetailsOpen] = useState(false);
    const [paymentReport, setPaymentReport] = useState(null);
    const [loadingReport, setLoadingReport] = useState(false);

    const dispatch = useDispatch();
    const memberStatusChange = useSelector((state) => state.data.getMemberDataChange);
    const selectedProgram = useSelector((state) => state.data.selectedProgram);
    const agentList = useSelector((state) => state.data.agentList);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    const defaultColDef = {
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
        minWidth: 100,
    };

    const { user } = useAuth();
    const gridRef = useRef();

    const statusFilterOptions = [
        { value: 'active', label: t('filters.activeMembers'), color: 'green' },
        { value: 'blocked', label: t('filters.blockedMembers'), color: 'red' }
    ];

    const genderFilterOptions = [
        { value: 'all', label: t('filters.allGender'), color: 'blue' },
        { value: 'male', label: t('filters.male'), color: 'blue' },
        { value: 'female', label: t('filters.female'), color: 'pink' }
    ];

    const downloadPdf = async (data) => {
        try {
            const res = await fetch("/api/certificate-send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberData: data, selectedProgram }),
            });

            if (!res.ok) throw new Error("Failed to generate PDF");

            const { base64 } = await res.json();
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "member-report.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Browser PDF error:", error);
            alert("Failed to download PDF");
        }
    };

    const handleShowPaymentDetails = async (data) => {
        setSelectedMember(data);
        setLoadingReport(true);
        setIsPaymentDetailsOpen(true);
        try {
            const res = await fetchSingleMemberMarriageReport({
                userId: user.uid,
                programId: selectedProgram.id,
                memberId: data.id
            });
            setPaymentReport(res);
        } catch (error) {
            console.error('Error fetching payment report:', error);
            message.error(t('errors.failedPaymentDetails'));
        } finally {
            setLoadingReport(false);
        }
    };

    async function loadAgentList(dataM) {
        try {
            const data = await getAgentMemberPaystatus({
                userId: user.uid,
                programId: selectedProgram.id,
                agentId: dataM.agentId,
            });
            console.log(data, "data");
        } catch (err) {
            console.log(err, "err");
        }
    }

    const COL_DEFS = [
        {
            field: "displayName",
            cellDataType: 'text',
            headerName: t('columns.name'),
            pinned: 'left',
            cellRenderer: (props) => {
                let statusClass = 'bg-white';
                if (props.data.status === 'blocked') statusClass = 'bg-red-50';

                const statusLabel =
                    props.data.status === 'blocked' ? t('status.blocked') :
                    props.data.delete_flag === true ? t('status.deleted') :
                    props.data.status === 'closed' ? t('status.closed') :
                    props.data.status === 'accepted' ? t('status.active') :
                    t('status.pending');

                return (
                    <div className={`flex items-center gap-2 relative ${statusClass}`}>
                        <div className={`absolute -left-2.5 top-[50%] ${!props.data.joinFeesDone ? 'bg-red-500' : 'bg-green-500'} h-2 w-2 rounded-full translate-y-[-50%]`} />
                        <Avatar src={props.data.photoURL} alt={props.data.displayName} size={30} />
                        <div className="flex flex-col">
                            <h1 className="font-medium">{props.data.displayName}</h1>
                            <span className="text-xs text-gray-500">{statusLabel}</span>
                        </div>
                    </div>
                );
            }
        },
        { field: "fatherName", headerName: t('columns.fatherName'), width: 150, cellDataType: "text" },
        { field: "jati", headerName: t('columns.surname'), width: 150, cellDataType: "text" },
        {
            field: "registrationNumber",
            headerName: t('columns.registrationNumber'),
            cellDataType: "text",
            cellRenderer: (props) => (
                <div className="font-semibold">{props.data.registrationNumber || '-'}</div>
            )
        },
        { field: "phone", headerName: t('columns.phone'), width: 120, cellDataType: "text" },
        {
            field: "gender",
            headerName: t('columns.gender'),
            width: 100,
            cellDataType: "text",
            cellRenderer: (props) => {
                const gender = props.data.gender;
                if (!gender) return '-';
                const label = gender === 'male' ? t('filters.male') : gender === 'female' ? t('filters.female') : gender;
                return (
                    <Tag color={gender === 'male' ? 'blue' : gender === 'female' ? 'pink' : 'default'}>
                        {label}
                    </Tag>
                );
            }
        },
        { field: "state", headerName: t('columns.state'), width: 100, cellDataType: "text" },
        {
            field: "addedByName",
            headerName: t('columns.createdBy'),
            cellRenderer: (props) => <div>{props.data.addedByName}</div>
        },
        { field: "aadhaarNo", headerName: t('columns.aadhaarNumber'), cellDataType: 'text' },
        {
            field: "payAmount",
            headerName: t('columns.dAmount'),
            cellRenderer: (props) => (
                <div className="flex items-center gap-2">
                    <div title={props.data.processedTooltipText} className={`h-2 w-2 rounded-full ${props.data.processedColorClass}`} />
                    <div>{props.data.payAmount}</div>
                </div>
            )
        },
        { field: "ageGroupRange", headerName: t('columns.ageGroup'), cellDataType: "text", width: 130 },
        {
            field: "createdAt",
            headerName: t('columns.createdDate'),
            width: 150,
            cellRenderer: (props) => props.data.dateJoin ? props.data.dateJoin : '-'
        },
        {
            field: "Action",
            headerName: t('columns.action'),
            pinned: 'right',
            width: 150,
            filter: false,
            cellRenderer: (props) => {
                const { data } = props;
                const isDeleted = data.delete_flag === true;
                const isBlocked = data.status === 'blocked';
                const isClosed = data.status === 'closed' && data.marriage_flag === true;

                const items = [
                    {
                        label: (
                            <Button
                                title={t('actions.closeForm')}
                                type="default"
                                onClick={() => { setSelectedMember(data); setIsOpenClosingForm(true); }}
                                className="flex items-center justify-center w-auto h-8 rounded-lg bg-blue-50 hover:bg-blue-100 border-blue-200 hover:scale-105 transition-transform"
                                disabled={isDeleted || isBlocked || isClosed}
                            >
                                <PlusCircleOutlined /> {t('actions.closeForm')}
                            </Button>
                        ),
                        key: '0',
                        disabled: isDeleted || isBlocked || isClosed,
                    },
                    {
                        label: (
                            <Tooltip title={data?.displayName ? t('actions.viewCertificate').replace('{name}', data.displayName) : t('actions.generateCertificate')}>
                                <Button
                                    type="default"
                                    onClick={() => { setSelectedMember(data); setIsModalOpen(true); }}
                                    className="flex items-center justify-center w-auto h-8 rounded-lg bg-blue-50 hover:bg-blue-100 border-blue-200 hover:scale-105 transition-transform"
                                    disabled={isDeleted}
                                >
                                    <GrCertificate className="text-red-500" /> {t('actions.memberCertificate')}
                                </Button>
                            </Tooltip>
                        ),
                        key: '1',
                        disabled: isDeleted,
                    },
                    {
                        label: (
                            <Tooltip title={data?.displayName ? t('actions.viewPaymentDetails').replace('{name}', data.displayName) : t('actions.paymentDetails')}>
                                <Button
                                    type="default"
                                    onClick={() => handleShowPaymentDetails(data)}
                                    className="flex items-center justify-center w-auto h-8 rounded-lg bg-blue-50 hover:bg-blue-100 border-blue-200 hover:scale-105 transition-transform"
                                    disabled={isDeleted || isBlocked || isClosed}
                                >
                                    <MdOutlinePendingActions className="text-red-500" /> {t('actions.paymentDetails')}
                                </Button>
                            </Tooltip>
                        ),
                        key: '2',
                        disabled: isDeleted || isBlocked || isClosed,
                    },
                    {
                        label: (
                            <Tooltip title={data?.displayName ? t('actions.viewRegForm') : t('actions.generateRegForm')}>
                                <Button 
                                    type="default"
                                    onClick={() => { setSelectedMember(data); setIsOpenRegModal(true); }}
                                    className="flex items-center justify-center w-auto h-8 rounded-lg bg-blue-50 hover:bg-blue-100 border-blue-200 hover:scale-105 transition-transform"
                                    disabled={isDeleted}
                                >
                                    <FaFile className="text-red-500" /> {t('actions.memberRegForm')}
                                </Button>
                            </Tooltip>
                        ),
                        key: '3',
                        disabled: isDeleted,
                    },
                ];

                return (
                    <div className="flex items-center justify-start gap-2">
                        <Tooltip title={t('actions.viewDetails')}>
                            <Button
                                type="primary"
                                icon={<EyeOutlined />}
                                onClick={() => { setSelectedMember(data); setIsDetailsView(true); }}
                                className="flex items-center justify-center w-8 h-8 rounded-lg hover:scale-105 transition-transform"
                            />
                        </Tooltip>
                        <Tooltip title={t('actions.editMember')}>
                            <Button
                                type="default"
                                icon={<EditOutlined />}
                                onClick={() => { setSelectedMember(data); setIsEditmemberOpen(true); }}
                                className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 border-blue-200 hover:scale-105 transition-transform"
                                disabled={isDeleted || isBlocked || isClosed}
                            />
                        </Tooltip>
                        <Tooltip title={t('actions.moreActions')}>
                            <Dropdown
                                menu={{ items: items.filter(item => !item.disabled) }}
                                trigger={['click']}
                            >
                                <Button
                                    type="default"
                                    icon={<BsThreeDots />}
                                    className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 border-blue-200 hover:scale-105 transition-transform"
                                    disabled={isDeleted}
                                />
                            </Dropdown>
                        </Tooltip>
                    </div>
                );
            }
        },
    ];

    const applyFilters = (data) => {
        if (!data || data.length === 0) return data;
        let filteredData = [...data];
        if (statusFilter === 'active') {
            filteredData = filteredData.filter(m => m.status === 'accepted' && m.active_flag === true && !m.delete_flag);
        } else if (statusFilter === 'blocked') {
            filteredData = filteredData.filter(m => m.status === 'blocked' && m.active_flag === false && !m.delete_flag);
        }
        if (genderFilter !== 'all') {
            filteredData = filteredData.filter(m => m.gender?.toLowerCase() === genderFilter.toLowerCase());
        }
        return filteredData;
    };

    const onGridReady = useCallback(async () => {
        setIsLoading(true);
        try {
            const memberData = await getData(
                `/users/${user.uid}/programs/${selectedProgram?.id}/members`,
                [{ field: 'delete_flag', operator: '==', value: false }],
                { field: 'createdAt', direction: 'desc' }
            );
            dispatch(setgetMemberDataChange(false));
            setAllMembersData(memberData);
            setFilteredMembersData(applyFilters(memberData));
        } catch (error) {
            console.error('Error fetching members:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedProgram, agentList, memberStatusChange, statusFilter, genderFilter]);

    useEffect(() => {
        if (allMembersData.length > 0) {
            setFilteredMembersData(applyFilters(allMembersData));
        }
    }, [statusFilter, genderFilter, allMembersData]);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (selectedProgram) onGridReady();
    }, [selectedProgram, memberStatusChange]);

    return (
        <div>
            {/* Filter Controls */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <Space wrap className="w-full justify-between">
                    <Space wrap>
                        <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 180 }} size="middle">
                            {statusFilterOptions.map(option => (
                                <Option key={option.value} value={option.value}>
                                    <Tag color={option.color} style={{ marginRight: 8 }}>{option.label}</Tag>
                                </Option>
                            ))}
                        </Select>
                        <Select value={genderFilter} onChange={setGenderFilter} style={{ width: 150 }} size="middle">
                            {genderFilterOptions.map(option => (
                                <Option key={option.value} value={option.value}>
                                    <Tag color={option.color} style={{ marginRight: 8 }}>{option.label}</Tag>
                                </Option>
                            ))}
                        </Select>
                    </Space>
                    <Tag color="blue" className="text-sm">
                        {t('filters.showing')}: {filteredMembersData.length} {t('filters.members')}
                    </Tag>
                </Space>
            </div>

            {/* AG Grid */}
            <div style={{ height: windowWidth < 768 ? '70vh' : '65vh' }}>
                <AgGridReact
                    ref={gridRef}
                    style={{ height: '100%' }}
                    rowData={filteredMembersData}
                    loading={isLoading}
                    defaultColDef={defaultColDef}
                    overlayLoadingTemplate={`<span class="ag-overlay-loading-center">${t('grid.loading')}</span>`}
                    overlayNoRowsTemplate={`<span class="ag-overlay-loading-center">${t('grid.noData')}</span>`}
                    columnDefs={COL_DEFS}
                    pagination={true}
                    onGridReady={onGridReady}
                />
            </div>

            {/* Modals */}
            <MemberDetailsView
                isModalVisible={isDetailsView}
                handleCloseModal={() => setIsDetailsView(false)}
                showDeleteConfirm={false}
                selectedMember={selectedMember}
            />
            <EditMember
                open={isEditmemberOpen}
                setOpen={setIsEditmemberOpen}
                memberData={selectedMember}
                programId={selectedProgram?.id}
                onSuccess={onGridReady}
            />
            <MemberCertificateCom
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                memberData={selectedMember}
            />
            <MemberRegForm
                open={isOpenRegModal}
                onClose={() => setIsOpenRegModal(false)}
                memberData={selectedMember}
            />
            {isOpenClosingForm && (
                <ClosingForm
                    open={isOpenClosingForm}
                    onClose={() => setIsOpenClosingForm(false)}
                    memberData={selectedMember}
                    user={user}
                    selectedProgram={selectedProgram}
                    onSuccess={onGridReady}
                />
            )}
            <MemberPaymentDetails
                visible={isPaymentDetailsOpen}
                onClose={() => { setIsPaymentDetailsOpen(false); setPaymentReport(null); }}
                memberData={selectedMember}
                paymentReport={paymentReport}
                loading={loadingReport}
            />
        </div>
    );
}

export default MemberList;