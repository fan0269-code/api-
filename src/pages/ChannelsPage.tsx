import { Activity, SlidersHorizontal } from 'lucide-react';
import { MetricCard, SectionHeader, StatusBadge } from '../components/ui';
import type { ChannelInfo, ToastMessage } from '../types';

export function ChannelsPage({
  channels,
  updateChannelStatus,
  pushToast
}: {
  channels: ChannelInfo[];
  updateChannelStatus: (id: string, status: ChannelInfo['status']) => Promise<ChannelInfo>;
  pushToast: (kind: ToastMessage['kind'], text: string) => void;
}) {
  const activeCount = channels.filter((channel) => channel.status === 'active').length;
  const coveredModels = new Set(channels.flatMap((channel) => (channel.status !== 'disabled' ? channel.models : [])));
  const totalWeight = channels.reduce((sum, channel) => sum + channel.weight, 0);

  const toggleStatus = async (channel: ChannelInfo) => {
    const nextStatus = channel.status === 'disabled' ? 'active' : 'disabled';
    await updateChannelStatus(channel.id, nextStatus);
    pushToast('success', nextStatus === 'active' ? '渠道已启用' : '渠道已停用');
  };

  return (
    <section className="page-grid">
      <SectionHeader eyebrow="Routing" title="渠道管理" />

      <div className="three-grid">
        <MetricCard label="启用渠道" value={`${activeCount}/${channels.length}`} detail="可参与真实上游转发" icon={<Activity size={18} />} />
        <MetricCard label="模型覆盖" value={`${coveredModels.size}`} detail="非停用渠道覆盖的模型数" icon={<SlidersHorizontal size={18} />} />
        <MetricCard label="总权重" value={`${totalWeight}`} detail="用于后续负载均衡策略" icon={<SlidersHorizontal size={18} />} />
      </div>

      <article className="card endpoint-card">
        <div>
          <span className="eyebrow">上游策略</span>
          <h3>真实转发优先，Mock 兜底验收</h3>
          <p className="muted">
            生产环境配置上游密钥后，RelayHub 会先检查模型是否有启用渠道；没有可用渠道时拒绝转发，避免绕过停用策略。
          </p>
        </div>
      </article>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>渠道</th>
              <th>供应商</th>
              <th>Base URL</th>
              <th>密钥</th>
              <th>优先级</th>
              <th>权重</th>
              <th>模型</th>
              <th>状态</th>
              <th>最近检测</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {channels.map((channel) => (
              <tr key={channel.id}>
                <td>{channel.name}</td>
                <td>{channel.provider}</td>
                <td>
                  <code>{channel.baseUrl}</code>
                </td>
                <td>
                  <code>{channel.maskedKey}</code>
                </td>
                <td>{channel.priority}</td>
                <td>{channel.weight}</td>
                <td>{channel.models.join(', ')}</td>
                <td>
                  <StatusBadge status={channel.status} />
                </td>
                <td>{channel.lastCheckedAt}</td>
                <td>
                  <button className="button-secondary" type="button" onClick={() => toggleStatus(channel)}>
                    {channel.status === 'disabled' ? '启用' : '停用'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
