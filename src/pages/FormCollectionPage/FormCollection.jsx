import { useState } from "react";
import { Card, Row, Col, message, Button, Result } from "antd";
import {
    StepsForm,
    ProFormText,
    ProFormTextArea,
    ProFormDatePicker,
    ProFormDigit,
    ProFormSelect,
    ProFormRadio,
} from "@ant-design/pro-components";
import { createQuoteRequest } from "../../api/quoteRequests.js";
import { QUOTE_REQUEST_FIELD_NAMES } from "../../constants/quoteRequest.js";
import "./FormCollection.css";

const LAST_STEP_INDEX = 4;
const HALF_COL_PROPS = { xs: 24, md: 12 };
const FORM_ROW_GUTTER = [16, 12];

// 日期统一转换为后端需要的 YYYY-MM-DD
function formatDate(value) {
    if (!value) {
        return undefined;
    }

    if (typeof value === "string") {
        return value;
    }

    return typeof value.format === "function" ? value.format("YYYY-MM-DD") : value;
}

function normalizeValue(value) {
    if (typeof value !== "string") {
        return value;
    }

    const trimmed = value.trim();
    return trimmed || undefined;
}

// 清理提交数据：只提交后端 CreateQuoteRequestRequest 允许的客户字段。
function cleanPayload(values) {
    const normalizedValues = {
        ...values,
        requestedDeliveryDate: formatDate(values.requestedDeliveryDate),
        soc: values.soc === "unknown" ? undefined : values.soc,
    };

    return Object.fromEntries(
        QUOTE_REQUEST_FIELD_NAMES
            .map((fieldName) => [fieldName, normalizeValue(normalizedValues[fieldName])])
            .filter(([, value]) => value !== undefined && value !== null)
    );
}

// 自定义分步表单底部按钮
function renderStepSubmitter(props) {
    const isFirstStep = props.step === 0;
    const isLastStep = props.step === LAST_STEP_INDEX;

    if (isFirstStep) {
        return (
            <div className="customer-form-actions">
                <Button
                    className="customer-form-actions__button"
                    type="primary"
                    onClick={() => props.onSubmit?.()}
                >
                    Next Step
                </Button>
            </div>
        );
    }

    if (isLastStep) {
        return (
            <div className="customer-form-actions">
                <Button
                    className="customer-form-actions__button"
                    onClick={() => props.onPre?.()}
                >
                    Previous
                </Button>
                <Button
                    className="customer-form-actions__button"
                    type="primary"
                    onClick={() => props.onSubmit?.()}
                >
                    Submit
                </Button>
            </div>
        );
    }

    return (
        <div className="customer-form-actions">
            <Button
                className="customer-form-actions__button"
                onClick={() => props.onPre?.()}
            >
                Previous
            </Button>
            <Button
                className="customer-form-actions__button"
                type="primary"
                onClick={() => props.onSubmit?.()}
            >
                Next Step
            </Button>
        </div>
    );
}

export default function QuoteRequestStepsForm() {
    const [submitted, setSubmitted] = useState(false);
    const [createdRequest, setCreatedRequest] = useState(null);

    // 最终提交：payload 字段与后端 CreateQuoteRequestRequest 保持一致。
    const handleSubmit = async (values) => {
        const payload = cleanPayload(values);

        try {
            const created = await createQuoteRequest(payload);

            setCreatedRequest(created);
            message.success("Quote request submitted successfully");
            setSubmitted(true);

            return true;
        } catch (error) {
            message.error(error.message);
            return false;
        }
    };

    // 提交成功后显示给客户的确认界面
    if (submitted) {
        return (
            <main className="customer-form-page">
                <Card
                    className="customer-form-card customer-form-card--result"
                >
                    <Result
                        status="success"
                        title="Quote request submitted successfully"
                        subTitle={
                            createdRequest?.internalQuoteNo
                                ? `Request ${createdRequest.internalQuoteNo} was created with trade code ${createdRequest.tradeCode} and filing number ${createdRequest.filingNumber}. Status: ${createdRequest.status}.`
                                : "Thank you for your request. Our sales team will contact you soon."
                        }
                        extra={[
                            <Button
                                className="customer-form-actions__button"
                                type="primary"
                                key="new-request"
                                onClick={() => {
                                    setCreatedRequest(null);
                                    setSubmitted(false);
                                }}
                            >
                                Submit another request
                            </Button>,
                        ]}
                    />
                </Card>
            </main>
        );
    }

    return (
        <main className="customer-form-page">
            <Card
                className="customer-form-card"
                title="Quote Request"
            >
                <StepsForm
                    onFinish={handleSubmit}
                    stepsProps={{
                        labelPlacement: "vertical",
                        responsive: false,
                        size: "small",
                    }}
                    submitter={{
                        render: renderStepSubmitter,
                    }}
                >
                {/* Step 1: 客户信息，对应后端 CustomerSection。 */}
                <StepsForm.StepForm name="customer" title="Customer">
                    <Row gutter={FORM_ROW_GUTTER}>
                        <Col {...HALF_COL_PROPS}>
                            <ProFormText
                                name="customerName"
                                label="Customer Name"
                                placeholder="Enter customer name"
                                fieldProps={{ maxLength: 100 }}
                                rules={[
                                    { required: true, message: "Please enter customer name" },
                                    { max: 100, message: "Customer name cannot exceed 100 characters" },
                                ]}
                            />
                        </Col>

                        <Col {...HALF_COL_PROPS}>
                            <ProFormText
                                name="email"
                                label="Email"
                                placeholder="Enter email address"
                                fieldProps={{ maxLength: 255 }}
                                rules={[
                                    { required: true, message: "Please enter your email" },
                                    { type: "email", message: "Please enter a valid email" },
                                    { max: 255, message: "Email cannot exceed 255 characters" },
                                ]}
                            />
                        </Col>

                        <Col {...HALF_COL_PROPS}>
                            <ProFormText
                                name="phone"
                                label="Phone"
                                placeholder="Enter phone number"
                                fieldProps={{ maxLength: 50 }}
                                rules={[
                                    { max: 50, message: "Phone cannot exceed 50 characters" },
                                ]}
                            />
                        </Col>

                        <Col {...HALF_COL_PROPS}>
                            <ProFormText
                                name="company"
                                label="Company"
                                placeholder="Enter company name"
                                fieldProps={{ maxLength: 150 }}
                                rules={[
                                    { max: 150, message: "Company cannot exceed 150 characters" },
                                ]}
                            />
                        </Col>

                        <Col {...HALF_COL_PROPS}>
                            <ProFormText
                                name="acpCustomer"
                                label="ACP Customer"
                                placeholder="Enter ACP customer account"
                                fieldProps={{ maxLength: 150 }}
                                rules={[
                                    {
                                        max: 150,
                                        message: "ACP Customer cannot exceed 150 characters",
                                    },
                                ]}
                            />
                        </Col>

                        <Col span={24}>
                            <ProFormTextArea
                                name="projectDescription"
                                label="Project Description"
                                placeholder="Describe your quotation or shipping requirement"
                                rules={[
                                    {
                                        required: true,
                                        message: "Please describe your project requirement",
                                    },
                                ]}
                                fieldProps={{
                                    rows: 4,
                                }}
                            />
                        </Col>
                    </Row>
                </StepsForm.StepForm>

                {/* Step 2: 运输信息，编号字段由后端生成 */}
                <StepsForm.StepForm name="shipping" title="Shipping">
                    <Row gutter={FORM_ROW_GUTTER}>
                        <Col {...HALF_COL_PROPS}>
                            <ProFormDatePicker
                                name="requestedDeliveryDate"
                                label="Requested Delivery Date"
                                placeholder="Select requested delivery date"
                                fieldProps={{
                                    format: "YYYY-MM-DD",
                                    style: { width: "100%" },
                                }}
                            />
                        </Col>
                    </Row>
                </StepsForm.StepForm>

                {/* Step 3: 货物信息 */}
                <StepsForm.StepForm name="cargo" title="Cargo">
                    <Row gutter={FORM_ROW_GUTTER}>
                        <Col {...HALF_COL_PROPS}>
                            <ProFormText
                                name="cargoNature"
                                label="Cargo Nature(s)"
                                placeholder="For example: General Cargo"
                                fieldProps={{ maxLength: 255 }}
                                rules={[
                                    {
                                        max: 255,
                                        message: "Cargo nature cannot exceed 255 characters",
                                    },
                                ]}
                            />
                        </Col>

                        <Col {...HALF_COL_PROPS}>
                            <ProFormText
                                name="commodity"
                                label="Commodity"
                                placeholder="For example: Electronics"
                                fieldProps={{ maxLength: 150 }}
                                rules={[
                                    {
                                        max: 150,
                                        message: "Commodity cannot exceed 150 characters",
                                    },
                                ]}
                            />
                        </Col>

                        <Col {...HALF_COL_PROPS}>
                            <ProFormDigit
                                name="volumeValue"
                                label="Volume Value"
                                placeholder="Enter cargo amount"
                                min={0}
                            />
                        </Col>

                        <Col {...HALF_COL_PROPS}>
                            <ProFormSelect
                                name="volumeUnit"
                                label="Volume Unit"
                                placeholder="Select cargo unit"
                                options={[
                                    { label: "TEU", value: "TEU" },
                                    { label: "CBM", value: "CBM" },
                                    { label: "Unit", value: "Unit" },
                                ]}
                            />
                        </Col>

                        <Col {...HALF_COL_PROPS}>
                            <ProFormDigit
                                name="grossWeightValue"
                                label="Gross Weight Value"
                                placeholder="Enter gross weight"
                                min={0}
                            />
                        </Col>

                        <Col {...HALF_COL_PROPS}>
                            <ProFormSelect
                                name="grossWeightUnit"
                                label="Gross Weight Unit"
                                placeholder="Select weight unit"
                                options={[
                                    { label: "kg", value: "kg" },
                                    { label: "ton", value: "ton" },
                                ]}
                            />
                        </Col>
                    </Row>
                </StepsForm.StepForm>

                {/* Step 4: 客户期望运价，不是最终报价 */}
                <StepsForm.StepForm name="rates" title="Rates">
                    <Row gutter={FORM_ROW_GUTTER}>
                        <Col {...HALF_COL_PROPS}>
                            <ProFormText
                                name="rateValidity"
                                label="Rate Validity"
                                placeholder="For example: 2026-06-30 or subject to carrier confirmation"
                            />
                        </Col>

                        <Col {...HALF_COL_PROPS}>
                            <ProFormText
                                name="targetFreight"
                                label="Freight / Target Freight"
                                placeholder="For example: USD 1800"
                                fieldProps={{ maxLength: 100 }}
                                rules={[
                                    {
                                        max: 100,
                                        message: "Target freight cannot exceed 100 characters",
                                    },
                                ]}
                            />
                        </Col>

                        <Col {...HALF_COL_PROPS}>
                            <ProFormText
                                name="paymentMode"
                                label="Payment Mode"
                                placeholder="For example: Prepaid / Collect"
                                fieldProps={{ maxLength: 100 }}
                                rules={[
                                    {
                                        max: 100,
                                        message: "Payment mode cannot exceed 100 characters",
                                    },
                                ]}
                            />
                        </Col>

                        <Col span={24}>
                            <ProFormTextArea
                                name="oceanSurcharges"
                                label="Ocean Surcharges"
                                placeholder="Enter ocean surcharge details"
                                fieldProps={{
                                    rows: 4,
                                }}
                            />
                        </Col>
                    </Row>
                </StepsForm.StepForm>

                {/* Step 5: 合约信息与备注 */}
                <StepsForm.StepForm name="contract" title="Contract">
                    <Row gutter={FORM_ROW_GUTTER}>
                        <Col {...HALF_COL_PROPS}>
                            <ProFormText
                                name="trafficTerms"
                                label="Traffic Terms"
                                placeholder="For example: CY/CY"
                                fieldProps={{ maxLength: 100 }}
                                rules={[
                                    {
                                        max: 100,
                                        message: "Traffic terms cannot exceed 100 characters",
                                    },
                                ]}
                            />
                        </Col>

                        <Col {...HALF_COL_PROPS}>
                            <ProFormText
                                name="bizNature"
                                label="Biz Nature"
                                placeholder="For example: Open / Committed"
                                fieldProps={{ maxLength: 100 }}
                                rules={[
                                    {
                                        max: 100,
                                        message: "Biz nature cannot exceed 100 characters",
                                    },
                                ]}
                            />
                        </Col>

                        <Col span={24}>
                            <ProFormRadio.Group
                                name="soc"
                                label="SOC"
                                initialValue="unknown"
                                options={[
                                    { label: "Yes", value: true },
                                    { label: "No", value: false },
                                    { label: "Unknown / Not sure", value: "unknown" },
                                ]}
                            />
                        </Col>

                        <Col span={24}>
                            <ProFormTextArea
                                name="remark"
                                label="Remark"
                                placeholder="Enter additional notes"
                                fieldProps={{
                                    rows: 4,
                                }}
                            />
                        </Col>
                    </Row>
                </StepsForm.StepForm>
                </StepsForm>
            </Card>
        </main>
    );
}
