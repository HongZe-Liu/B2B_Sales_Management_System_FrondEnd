import { useState } from 'react'
import {
  CalculatorOutlined,
  DashboardOutlined,
  CrownOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Dropdown, Layout, Menu, Space, Typography } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  clearAuthSession,
  getStoredUser,
  isAdminUser,
  logout,
} from '../../api/auth.js'
import Logo from '../../assets/pics/logo.png'
import './DashboardLayout.css'

const { Header, Content, Sider } = Layout
const { Text } = Typography
const menuPathMap = {
  admin: '/admin',
  quotation: '/dashboard/quotation',
  calculator: '/dashboard/calculator',
  'data-analysis': '/dashboard/data-analysis',
  profile: '/dashboard/profile',
}

// 左侧导航菜单：以后新增页面，主要改这里。
const salesMenuItems = [
  {
    key: 'quotation',
    icon: <DashboardOutlined />,
    label: 'Quotation',
  },
  {
    key: 'calculator',
    icon: <CalculatorOutlined />,
    label: 'Order Calculation',
  },
  {
    key: 'data-analysis',
    icon: <TeamOutlined />,
    label: 'Data analysis',
  },
  {
    key: 'profile',
    icon: <SettingOutlined />,
    label: 'Personal information',
  },
]

// 后台整体布局：左侧菜单、顶部栏和内容区。
function DashboardLayout({
  title = 'Sales Management System',
  selectedKey = 'quotation',
  userName = 'Sales User',
  children,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const storedUser = getStoredUser()
  const isAdmin = isAdminUser(storedUser)
  const menuItems = [
    ...(isAdmin
      ? [
          {
            key: 'admin',
            icon: <CrownOutlined />,
            label: 'Admin Console',
          },
        ]
      : []),
    ...salesMenuItems,
  ]
  const activeKey =
    Object.entries(menuPathMap).find(([, path]) => path === location.pathname)?.[0] ||
    selectedKey
  const displayUserName = storedUser?.name || userName

  // 右上角用户菜单：后续可接个人资料和退出登录逻辑。
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
    },
  ]

  // 右上角菜单点击：Profile 进入个人信息页面。
  const handleUserMenuClick = async ({ key }) => {
    if (key === 'profile') {
      navigate('/dashboard/profile')
      return
    }

    if (key === 'logout') {
      try {
        await logout()
      } catch {
        // JWT logout is stateless; local cleanup is still the source of truth.
      } finally {
        clearAuthSession()
        navigate('/login', { replace: true })
      }
    }
  }

  return (
    <Layout className="dashboard-layout">
      {/* 左侧导航：所有后台页面共用。 */}
      <Sider
        breakpoint="lg"
        className="dashboard-layout__sider"
        collapsed={collapsed}
        collapsible
        trigger={null}
        width={240}
        onCollapse={setCollapsed}
      >
        <div className="dashboard-layout__brand">
          {/* 左侧品牌区：使用公司 Logo 作为后台标题。 */}
          <img
            className={`dashboard-layout__brand-logo${
              collapsed ? ' dashboard-layout__brand-logo--collapsed' : ''
            }`}
            src={Logo}
            alt={title}
          />
        </div>

        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          items={menuItems}
          onClick={({ key }) => {
            navigate(menuPathMap[key])
          }}
        />
      </Sider>

      <Layout>
        {/* 顶部栏：折叠菜单和用户入口。 */}
        <Header className="dashboard-layout__header">
          <Button
            aria-label="Toggle menu"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            type="text"
            onClick={() => setCollapsed(!collapsed)}
          />

          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleUserMenuClick,
            }}
            trigger={['click']}
          >
            <Space className="dashboard-layout__user">
              <Avatar icon={<UserOutlined />} />
              <Text>{displayUserName}</Text>
            </Space>
          </Dropdown>
        </Header>

        {/* 内容区：具体页面在这里显示。 */}
        <Content className="dashboard-layout__content">{children}</Content>
      </Layout>
    </Layout>
  )
}

export default DashboardLayout
