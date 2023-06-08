// Copyright 2022-2023 The Memphis.dev Authors
// Licensed under the Memphis Business Source License 1.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// Changed License: [Apache License, Version 2.0 (https://www.apache.org/licenses/LICENSE-2.0), as published by the Apache Foundation.
//
// https://github.com/memphisdev/memphis/blob/master/LICENSE
//
// Additional Use Grant: You may make use of the Licensed Work (i) only as part of your own product or service, provided it is not a message broker or a message queue product or service; and (ii) provided that you do not use, provide, distribute, or make available the Licensed Work as a Service.
// A "Service" is a commercial offering, product, hosted, or managed service, that allows third parties (other than your own employees and contractors acting on your behalf) to access and/or use the Licensed Work or a substantial set of the features or functionality of the Licensed Work to third parties as a software-as-a-service, platform-as-a-service, infrastructure-as-a-service or other similar services that compete with Licensor products or services.

import './style.scss';

import React, { useEffect, useContext, useState, useRef } from 'react';
import { Virtuoso } from 'react-virtuoso';

import searchIcon from '../../assets/images/searchIcon.svg';
import { ApiEndpoints } from '../../const/apiEndpoints';
import SearchInput from '../../components/searchInput';
import CreateUserDetails from './createUserDetails';
import { httpRequest } from '../../services/http';
import Loader from '../../components/loader';
import Button from '../../components/button';
import { Context } from '../../hooks/store';
import Modal from '../../components/modal';
import UserItem from './userItem';
import { LOCAL_STORAGE_USER_PASS_BASED_AUTH } from '../../const/localStorageConsts';
import Table from '../../components/table';

const UsersData = [
    {
        key: '1',
        username: 'a@a.gmail.com',
        avatar_id: 1,
        status: 0,
        full_name: 'A A',
        team: 'Team A',
        position: 'Manager',
        created_at: '2021-08-01 12:00:00'
    },
    {
        key: '2',
        username: 't@t.gmail.com',
        avatar_id: 2,
        status: 1,
        full_name: 'T T',
        team: 'Team B',
        position: 'R&D',
        created_at: '2021-08-01 12:00:00'
    }
];

function Users() {
    const [state, dispatch] = useContext(Context);
    const [userList, setUsersList] = useState([]);
    const [copyOfUserList, setCopyOfUserList] = useState([]);
    const [addUserModalIsOpen, addUserModalFlip] = useState(false);
    const [userDetailsModal, setUserDetailsModal] = useState(false);
    const createUserRef = useRef(null);
    const [searchInput, setSearchInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        dispatch({ type: 'SET_ROUTE', payload: 'users' });
        getAllUsers();
    }, [dispatch]);

    const getAllUsers = async () => {
        try {
            setIsLoading(true);
            const data = await httpRequest('GET', ApiEndpoints.GET_ALL_USERS);
            if (data) {
                data.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                setUsersList(data);
                setCopyOfUserList(data);
            }
        } catch (error) {}
        setIsLoading(false);
    };

    useEffect(() => {
        if (searchInput.length > 1) {
            const results = userList?.filter(
                (userData) => userData?.username?.toLowerCase()?.includes(searchInput) || userData?.user_type?.toLowerCase()?.includes(searchInput)
            );
            setUsersList(results);
        } else {
            setUsersList(copyOfUserList);
        }
    }, [searchInput]);

    const handleSearch = (e) => {
        setSearchInput(e.target.value);
    };

    const removeUser = async (username) => {
        const updatedUserList = userList.filter((item) => item.username !== username);
        setUsersList(updatedUserList);
        setCopyOfUserList(updatedUserList);
    };

    const closeModal = (userData) => {
        let newUserList = userList;
        newUserList.push(userData);
        setUsersList(newUserList);
        setCopyOfUserList(newUserList);
        addUserModalFlip(false);
        if (userData.user_type === 'application' && localStorage.getItem(LOCAL_STORAGE_USER_PASS_BASED_AUTH) === 'false') {
            setUserDetailsModal(true);
        }
    };

    const getAvatarSrc = (avatarId) => {
        return require(`../../assets/images/bots/avatar${avatarId}.svg`);
    };

    const clientColumns = [
        {
            title: 'Username',
            dataIndex: 'username',
            key: 'username',
            // sorter: (a, b) => a.username.localeCompare(b.username),
            render: (text, record) => (
                <div className="user-name">
                    <div className="user-avatar">
                        <img src={getAvatarSrc(record.avatar_id)} width={25} height={25} alt="avatar" />
                    </div>
                    <p>{text}</p>
                </div>
            )
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => (
                <div className="user-name">
                    <p>{status}</p>
                </div>
            )
        },
        {
            title: 'Full Name',
            key: 'full_name',
            dataIndex: 'full_name'
        },
        {
            title: 'Team',
            key: 'team',
            dataIndex: 'team'
        },
        {
            title: 'Position',
            key: 'position',
            dataIndex: 'position'
        },
        {
            title: 'Creation date',
            key: 'created_at',
            dataIndex: 'created_at'
        },
        {
            title: 'Action',
            dataIndex: 'action',
            key: 'action'
        }
    ];

    return (
        <div className="users-container">
            <div className="header-wraper">
                <div className="main-header-wrapper">
                    <label className="main-header-h1">Users</label>
                    <span className="memphis-label">For client authentication, choose "Application". For management only, choose "Management".</span>
                </div>
                <div className="add-search-user">
                    <SearchInput
                        placeholder="Search here"
                        colorType="navy"
                        backgroundColorType="gray-dark"
                        width="288px"
                        height="34px"
                        borderRadiusType="circle"
                        borderColorType="none"
                        boxShadowsType="none"
                        iconComponent={<img src={searchIcon} alt="searchIcon" />}
                        onChange={handleSearch}
                        value={searchInput}
                    />
                    <Button
                        className="modal-btn"
                        width="160px"
                        height="34px"
                        placeholder={'Add new user'}
                        colorType="white"
                        radiusType="circle"
                        backgroundColorType="purple"
                        fontSize="12px"
                        fontWeight="600"
                        boxShadowStyle="float"
                        aria-haspopup="true"
                        onClick={() => addUserModalFlip(true)}
                    />
                </div>
            </div>
            <div className="users-list-container">
                {isLoading && (
                    <div className="loader-uploading">
                        <Loader />
                    </div>
                )}
                {!isLoading && userList.length > 0 && (
                    // <Virtuoso
                    //     data={userList}
                    //     overscan={100}
                    //     itemContent={(index, user) => <UserItem key={user.id} content={user} handleRemoveUser={() => removeUser(user.username)} />}
                    // />
                    <Table tableRowClassname="user-row" title={() => 'Header'} columns={clientColumns} data={UsersData} />
                )}
            </div>
            <Modal
                header="Create new user"
                height="550px"
                rBtnText="Create"
                lBtnText="Cancel"
                lBtnClick={() => {
                    addUserModalFlip(false);
                }}
                clickOutside={() => addUserModalFlip(false)}
                rBtnClick={() => {
                    createUserRef.current();
                }}
                open={addUserModalIsOpen}
            >
                <CreateUserDetails createUserRef={createUserRef} closeModal={(userData) => closeModal(userData)} />
            </Modal>
            <Modal
                header="User connection details"
                height="220px"
                rBtnText="Close"
                clickOutside={() => setUserDetailsModal(false)}
                rBtnClick={() => {
                    setUserDetailsModal(false);
                }}
                open={userDetailsModal}
            >
                <div className="user-details-modal">
                    <p className="userName">
                        Username: <span>{userList[userList.length - 1]?.username}</span>
                    </p>
                    <p className="creds">
                        Connection token: <span>{userList[userList.length - 1]?.broker_connection_creds}</span>
                    </p>
                    <p className="note">Please note when you close this modal, you will not be able to restore your user details!!</p>
                </div>
            </Modal>
        </div>
    );
}
export default Users;
