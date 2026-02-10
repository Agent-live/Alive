import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Header } from '../../components/common/Header';
import { Button } from '../../components/common/Button';
import { Icon } from '../../components/common/Icon';
import { LoadingSpinner } from '../../components/feedback/Loading';
import { useAuthStore, toast } from '../../store';
import { AddressFormData } from '../../types';
import { validateAddressForm } from '../../utils/validators';

const TAGS: { id: 'home' | 'company' | 'other'; label: string }[] = [
  { id: 'home', label: '家' },
  { id: 'company', label: '公司' },
  { id: 'other', label: '其他' },
];

// 模拟省市区数据
const REGIONS = {
  provinces: ['上海市', '北京市', '广东省', '浙江省', '江苏省'],
  cities: {
    '上海市': ['上海市'],
    '北京市': ['北京市'],
    '广东省': ['广州市', '深圳市', '东莞市'],
    '浙江省': ['杭州市', '宁波市', '温州市'],
    '江苏省': ['南京市', '苏州市', '无锡市'],
  },
  districts: {
    '上海市': ['黄浦区', '静安区', '徐汇区', '浦东新区', '长宁区'],
    '北京市': ['东城区', '西城区', '朝阳区', '海淀区', '丰台区'],
    '广州市': ['天河区', '越秀区', '海珠区', '荔湾区'],
    '深圳市': ['福田区', '南山区', '罗湖区', '宝安区'],
    '杭州市': ['西湖区', '上城区', '滨江区', '余杭区'],
    '南京市': ['玄武区', '秦淮区', '鼓楼区', '建邺区'],
  },
};

export default function AddressEditPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addressId = searchParams.get('id');
  const isEdit = !!addressId;

  const { addresses, addAddress, updateAddress, fetchAddresses } = useAuthStore();

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<AddressFormData>({
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    street: '',
    postalCode: '',
    isDefault: false,
    tag: 'home',
  });

  // 加载现有地址数据
  useEffect(() => {
    if (isEdit) {
      const load = async () => {
        await fetchAddresses();
        const existingAddress = addresses.find((a) => a.id === addressId);
        if (existingAddress) {
          setForm({
            name: existingAddress.name,
            phone: existingAddress.phone,
            province: existingAddress.province,
            city: existingAddress.city,
            district: existingAddress.district,
            street: existingAddress.street,
            postalCode: existingAddress.postalCode || '',
            isDefault: existingAddress.isDefault,
            tag: existingAddress.tag || 'home',
          });
        }
        setLoading(false);
      };
      load();
    }
  }, [isEdit, addressId, addresses, fetchAddresses]);

  const handleChange = (field: keyof AddressFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // 清除该字段的错误
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // 级联清空
    if (field === 'province') {
      setForm((prev) => ({ ...prev, city: '', district: '' }));
    }
    if (field === 'city') {
      setForm((prev) => ({ ...prev, district: '' }));
    }
  };

  const handleSubmit = async () => {
    // 验证表单
    const validation = validateAddressForm(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      const firstError = Object.values(validation.errors)[0];
      toast.warning(firstError);
      return;
    }

    setSaving(true);
    try {
      if (isEdit && addressId) {
        await updateAddress(addressId, form);
      } else {
        await addAddress({ ...form, isDefault: form.isDefault ?? false });
      }
      navigate(-1);
    } catch (error) {
      // Error handled in store
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const cities = form.province
    ? REGIONS.cities[form.province as keyof typeof REGIONS.cities] || []
    : [];
  const districts = form.city
    ? REGIONS.districts[form.city as keyof typeof REGIONS.districts] || []
    : [];

  return (
    <div className="app-shell">
      <Header title={isEdit ? '编辑地址' : '新增地址'} />

      <main className="max-w-app mx-auto px-4 pb-24">
        <div className="mt-4 bg-white rounded-xl overflow-hidden">
          {/* 收货人 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center">
              <label className="w-20 text-sm text-text-secondary">收货人</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="请输入收货人姓名"
                className={`flex-1 text-sm outline-none ${errors.name ? 'text-error' : ''}`}
                maxLength={20}
              />
            </div>
          </div>

          {/* 手机号 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center">
              <label className="w-20 text-sm text-text-secondary">手机号</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                placeholder="请输入手机号"
                className={`flex-1 text-sm outline-none ${errors.phone ? 'text-error' : ''}`}
                maxLength={11}
              />
            </div>
          </div>

          {/* 省份 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center">
              <label className="w-20 text-sm text-text-secondary">省份</label>
              <select
                value={form.province}
                onChange={(e) => handleChange('province', e.target.value)}
                className={`flex-1 text-sm outline-none bg-transparent ${
                  errors.province ? 'text-error' : form.province ? '' : 'text-text-muted'
                }`}
              >
                <option value="">请选择省份</option>
                {REGIONS.provinces.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <Icon name="chevron_right" className="text-xl text-text-muted" />
            </div>
          </div>

          {/* 城市 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center">
              <label className="w-20 text-sm text-text-secondary">城市</label>
              <select
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                disabled={!form.province}
                className={`flex-1 text-sm outline-none bg-transparent ${
                  errors.city ? 'text-error' : form.city ? '' : 'text-text-muted'
                }`}
              >
                <option value="">请选择城市</option>
                {cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Icon name="chevron_right" className="text-xl text-text-muted" />
            </div>
          </div>

          {/* 区县 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center">
              <label className="w-20 text-sm text-text-secondary">区县</label>
              <select
                value={form.district}
                onChange={(e) => handleChange('district', e.target.value)}
                disabled={!form.city}
                className={`flex-1 text-sm outline-none bg-transparent ${
                  errors.district ? 'text-error' : form.district ? '' : 'text-text-muted'
                }`}
              >
                <option value="">请选择区县</option>
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <Icon name="chevron_right" className="text-xl text-text-muted" />
            </div>
          </div>

          {/* 详细地址 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-start">
              <label className="w-20 text-sm text-text-secondary pt-0.5">详细地址</label>
              <textarea
                value={form.street}
                onChange={(e) => handleChange('street', e.target.value)}
                placeholder="请输入详细地址（街道、门牌号等）"
                className={`flex-1 text-sm outline-none resize-none ${errors.street ? 'text-error' : ''}`}
                rows={2}
                maxLength={100}
              />
            </div>
          </div>

          {/* 标签 */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center">
              <label className="w-20 text-sm text-text-secondary">标签</label>
              <div className="flex-1 flex gap-2">
                {TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleChange('tag', tag.id)}
                    className={`
                      px-4 py-1.5 rounded-full text-sm transition-all
                      ${form.tag === tag.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-text-secondary'
                      }
                    `}
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 设为默认 */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-text-secondary">设为默认地址</label>
              <button
                onClick={() => handleChange('isDefault', !form.isDefault)}
                className={`
                  relative w-12 h-7 rounded-full transition-colors
                  ${form.isDefault ? 'bg-primary' : 'bg-gray-200'}
                `}
              >
                <div
                  className={`
                    absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform
                    ${form.isDefault ? 'left-6' : 'left-1'}
                  `}
                />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 保存按钮 */}
      <div className="fixed bottom-0 left-0 right-0 surface-panel border-t border-gray-100">
        <div className="max-w-app mx-auto px-4 py-3">
          <Button
            variant="primary"
            fullWidth
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
        <div className="h-safe-bottom surface-panel" />
      </div>
    </div>
  );
}
