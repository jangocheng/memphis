// Copyright 2021-2022 The Memphis Authors
// Licensed under the MIT License (the "License");
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// This license limiting reselling the software itself "AS IS".

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import './style.scss';

import Editor from '@monaco-editor/react';
import React, { useState } from 'react';
import { Form } from 'antd';

import BackIcon from '../../../../assets/images/backIcon.svg';
import { ApiEndpoints } from '../../../../const/apiEndpoints';
import RadioButton from '../../../../components/radioButton';
import { httpRequest } from '../../../../services/http';
import TagsList from '../../../../components/tagsList';
import Button from '../../../../components/button';
import Input from '../../../../components/Input';

const schemaTypes = [
    {
        id: 1,
        value: 'Protobuf',
        label: 'Protobuf',
        description: (
            <span>
                The modern. Protocol buffers are Google's language-neutral, platform-neutral, extensible mechanism for serializing structured data – think XML, but
                smaller, faster, and simpler.
            </span>
        )
    },
    {
        id: 2,
        value: 'avro',
        label: 'Avro',
        description: (
            <span>
                The popular. Apache Avro™ is the leading serialization format for record data, and first choice for streaming data pipelines. It offers excellent schema
                evolution.
            </span>
        ),
        disabled: true
    },
    {
        id: 3,
        value: 'json',
        label: 'Json',
        description: <span>The simplest. JSON Schema is a vocabulary that allows you to annotate and validate JSON documents.</span>,
        disabled: true
    }
];

const SchemaEditorExample = {
    Protobuf: {
        language: 'proto',
        value: `syntax = "proto3";
        message Test {
            string field1 = 1;
            string  field2 = 2;
            int32  field3 = 3;
        }`
    },
    avro: {
        language: 'json',
        value: `{
            "type": "record",
            "namespace": "com.example",
            "name": "test-schema",
            "fields": [
               { "name": "username", "type": "string", "default": "-2" },
               { "name": "age", "type": "int", "default": "none" },
               { "name": "phone", "type": "int", "default": "NONE" },
               { "name": "country", "type": "string", "default": "NONE" }
            ]
        }`
    }
};

function CreateSchema({ goBack }) {
    const [creationForm] = Form.useForm();

    const [formFields, setFormFields] = useState({
        name: '',
        type: 'Protobuf',
        // tags: [],
        schema_content: ''
    });
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [validateLoading, setValidateLoading] = useState(false);
    const [validateError, setValidateError] = useState('');
    const [validateSuccess, setValidateSuccess] = useState(false);

    const handleSubmit = async (e) => {
        const values = await creationForm.validateFields();
        if (values?.errorFields) {
            return;
        } else {
            try {
                setLoadingSubmit(true);
                const data = await httpRequest('POST', ApiEndpoints.CREATE_NEW_SCHEMA, values);
                if (data) {
                    goBack();
                }
            } catch (err) {}
            setLoadingSubmit(false);
        }
    };

    const updateFormState = (field, value) => {
        let updatedValue = { ...formFields };
        updatedValue[field] = value;
        setFormFields((formFields) => ({ ...formFields, ...updatedValue }));
    };

    const handleValidateSchema = async () => {
        setValidateLoading(true);
        try {
            const data = await httpRequest('POST', ApiEndpoints.VALIDATE_SCHEMA, {
                schema_type: formFields?.type,
                schema_content: formFields.schema_content || SchemaEditorExample[formFields?.type]?.value
            });
            if (data.is_valid) {
                setTimeout(() => {
                    setValidateSuccess(true);
                }, 1000);
                setValidateLoading(false);
            }
        } catch (error) {
            if (error.status === 555) {
                setValidateError(error.data.message);
            }
            setValidateLoading(false);
        }
    };

    return (
        <div className="create-schema-wrapper">
            <div className="header">
                <div className="flex-title">
                    <img src={BackIcon} onClick={() => goBack()} />
                    <p>Create schema</p>
                </div>
                <span>
                    Creating a schema will enable you to enforce standardization upon produced data and increase data quality.
                    <a href="https://docs.memphis.dev/memphis-new/getting-started/1-installation" target="_blank">
                        Learn more
                    </a>
                </span>
            </div>
            <Form name="form" form={creationForm} autoComplete="off" className="create-schema-form">
                <div className="left-side">
                    <Form.Item
                        name="name"
                        rules={[
                            {
                                required: true,
                                message: 'Please input schema name!'
                            }
                        ]}
                    >
                        <div className="schema-field name">
                            <p className="field-title">Schema name</p>
                            <Input
                                placeholder="Type schema name"
                                type="text"
                                radiusType="semi-round"
                                colorType="gray"
                                backgroundColorType="white"
                                borderColorType="gray"
                                fontSize="12px"
                                height="40px"
                                width="200px"
                                onBlur={(e) => updateFormState('name', e.target.value)}
                                onChange={(e) => updateFormState('name', e.target.value)}
                                value={formFields.name}
                            />
                        </div>
                    </Form.Item>
                    <Form.Item name="tags">
                        <div className="schema-field tags">
                            <p className="field-title">Tags</p>
                            <TagsList addNew={true} />
                        </div>
                    </Form.Item>
                    <Form.Item name="type" initialValue={formFields.type}>
                        <div className="schema-field type">
                            <p className="field-title">Schema type</p>
                            <RadioButton
                                vertical={true}
                                options={schemaTypes}
                                radioWrapper="schema-type"
                                radioValue={formFields.type}
                                onChange={(e) => updateFormState('type', e.target.value)}
                            />
                        </div>
                    </Form.Item>
                </div>
                <div className="right-side">
                    <div className="schema-field schema">
                        <div className="title-wrapper">
                            <p className="field-title">Structure definition</p>
                            <Button
                                width="115px"
                                height="34px"
                                placeholder="Validate"
                                colorType="white"
                                radiusType="circle"
                                backgroundColorType="purple"
                                fontSize="12px"
                                fontFamily="InterSemiBold"
                                isLoading={validateLoading}
                                onClick={() => handleValidateSchema()}
                            />
                        </div>
                        <div className="editor">
                            <Form.Item
                                name="schema_content"
                                className="schema-item"
                                initialValue={SchemaEditorExample[formFields?.type]?.value}
                                rules={[
                                    {
                                        required: true,
                                        message: 'Schema content cannot be empty'
                                    }
                                ]}
                            >
                                <Editor
                                    options={{
                                        minimap: { enabled: false },
                                        scrollbar: { verticalScrollbarSize: 0 },
                                        scrollBeyondLastLine: false,
                                        roundedSelection: false,
                                        formatOnPaste: true,
                                        formatOnType: true
                                    }}
                                    language={SchemaEditorExample[formFields?.type]?.language}
                                    defaultValue={SchemaEditorExample[formFields?.type]?.value}
                                    value={formFields.schema_content}
                                    onChange={(value) => updateFormState('schema_content', value)}
                                />
                                {/* <div className="validate-note">
                                    <p>hvhvjhbk</p>
                                </div> */}
                            </Form.Item>
                        </div>
                    </div>
                    <Form.Item className="button-container">
                        <Button
                            width="105px"
                            height="34px"
                            placeholder="Close"
                            colorType="black"
                            radiusType="circle"
                            backgroundColorType="white"
                            border="gray-light"
                            fontSize="12px"
                            fontFamily="InterSemiBold"
                            onClick={() => goBack()}
                        />
                        <Button
                            width="125px"
                            height="34px"
                            placeholder="Create Schema"
                            colorType="white"
                            radiusType="circle"
                            backgroundColorType="purple"
                            fontSize="12px"
                            fontFamily="InterSemiBold"
                            isLoading={loadingSubmit}
                            onClick={handleSubmit}
                        />
                    </Form.Item>
                </div>
            </Form>
        </div>
    );
}

export default CreateSchema;
