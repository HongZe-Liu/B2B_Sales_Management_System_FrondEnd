import './Login.css'
import { LockOutlined, MailOutlined } from '@ant-design/icons'
import { message } from 'antd'
import {
  LoginForm,
  ProConfigProvider,
  ProFormText,
} from '@ant-design/pro-components'
import { useNavigate } from 'react-router-dom'
import {
  getDefaultAuthenticatedPath,
  login,
  saveAuthSession,
} from '../../api/auth.js'
import loginLogo from '../../assets/pics/logo.png'
// 登陆页面

function LoginContent() {
  const navigate = useNavigate()

  // 表单提交：调用后端登录接口，成功后按用户角色进入默认后台。
  const handleLogin = async (values) => {
    try {
      const loginResponse = await login(values)
      saveAuthSession(loginResponse)
      message.success('Login successful')
      navigate(getDefaultAuthenticatedPath(loginResponse.user), {
        replace: true,
      })
      return true
    } catch (error) {
      message.error(error.message)
      return false
    }
  }

  return (
    // 页面外层：负责白色背景和整体居中。
    <main className="login-shell">
      {/* 登录区域：控制表单宽度。 */}
      <section className="login-form-wrapper">
        {/* 公司 Logo。 */}
        <img
          className="login-logo"
          src={loginLogo}
          alt="Sales Management System"
        />

        {/* ProComponents 登录表单。 */}
        <LoginForm
          title="Sales Management System"
          contentStyle={{ width: '100%' }}
          onFinish={handleLogin}
          submitter={{
            searchConfig: {
              submitText: 'login',
            },
          }}
        >
          {/* 邮箱输入框。 */}
          <ProFormText
            name="email"
            fieldProps={{
              prefix: <MailOutlined className="prefixIcon" />,
            }}
            placeholder="please input your email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          />

          {/* 密码输入框。 */}
          <ProFormText.Password
            name="password"
            fieldProps={{
              prefix: <LockOutlined className="prefixIcon" />,
            }}
            placeholder="please input password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          />
        </LoginForm>
      </section>
    </main>
  )
}

function Login() {
  return (
    // ProComponents 配置：关闭 hash，方便写 CSS 覆盖样式。
    <ProConfigProvider hashed={false}>
      <LoginContent />
    </ProConfigProvider>
  )
}

export default Login
