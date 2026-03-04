import { useEffect, useState } from 'react';
import { channelApi, ChannelItem, ChannelType } from '../../api/channels';

interface ChannelConnectionModalProps {
  agentId: string;
  visible: boolean;
  onClose: () => void;
}

const CHANNEL_CONFIGS: { type: ChannelType; label: string; icon: string; description: string }[] = [
  { type: 'whatsapp', label: 'WhatsApp', icon: '💬', description: 'Connect via WhatsApp messaging' },
  { type: 'telegram', label: 'Telegram', icon: '✈️', description: 'Connect via Telegram bot' },
  { type: 'discord', label: 'Discord', icon: '🎮', description: 'Add to Discord server' },
  { type: 'wechat', label: 'WeChat', icon: '🟢', description: 'Connect via WeChat' },
  { type: 'line', label: 'Line', icon: '💚', description: 'Connect via Line messaging' },
  { type: 'signal', label: 'Signal', icon: '🔒', description: 'Connect via Signal (private)' },
  { type: 'twitter', label: 'Twitter/X', icon: '🐦', description: 'Connect as Twitter bot' },
  { type: 'email', label: 'Email', icon: '📧', description: 'Connect via email address' },
  { type: 'webchat', label: 'Web Chat', icon: '🌐', description: 'Embed on your website' },
];

interface ConnectResult {
  status: string;
  isDemo?: boolean;
  handle?: string;
  deepLink?: string;
  qrCode?: string;
}

export function ChannelConnectionModal({ agentId, visible, onClose }: ChannelConnectionModalProps) {
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [connecting, setConnecting] = useState<ChannelType | null>(null);
  const [connectResults, setConnectResults] = useState<Record<string, ConnectResult>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && agentId) {
      setLoading(true);
      channelApi.listChannels(agentId)
        .then(setChannels)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [visible, agentId]);

  if (!visible) return null;

  const connectedMap = Object.fromEntries(channels.map((c) => [c.type, c]));

  const handleConnect = async (channelType: ChannelType) => {
    setConnecting(channelType);
    try {
      const result = await channelApi.connect(agentId, channelType);
      setConnectResults((prev) => ({ ...prev, [channelType]: result }));
      // Refresh channel list
      const updated = await channelApi.listChannels(agentId);
      setChannels(updated);
    } catch (error) {
      console.error('Failed to connect channel:', error);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (channelType: ChannelType) => {
    setConnecting(channelType);
    try {
      await channelApi.disconnect(agentId, channelType);
      const updated = await channelApi.listChannels(agentId);
      setChannels(updated);
      setConnectResults((prev) => {
        const next = { ...prev };
        delete next[channelType];
        return next;
      });
    } catch (error) {
      console.error('Failed to disconnect channel:', error);
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="channel-modal-backdrop" onClick={onClose}>
      <div className="channel-modal" onClick={(e) => e.stopPropagation()}>
        <style>{`
          .channel-modal-backdrop {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.7);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .channel-modal {
            background: #1a1a2e;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 24px;
            width: 90%;
            max-width: 560px;
            max-height: 80vh;
            overflow-y: auto;
          }
          .channel-modal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
          }
          .channel-modal-title {
            font-size: 18px;
            font-weight: 600;
            color: #fff;
          }
          .channel-modal-close {
            background: none;
            border: none;
            color: rgba(255,255,255,0.5);
            font-size: 20px;
            cursor: pointer;
            padding: 4px 8px;
          }
          .channel-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .channel-card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .channel-card.connected {
            border-color: rgba(78, 205, 196, 0.4);
            background: rgba(78, 205, 196, 0.05);
          }
          .channel-card-header {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .channel-icon { font-size: 20px; }
          .channel-label {
            font-size: 14px;
            font-weight: 600;
            color: #fff;
          }
          .channel-desc {
            font-size: 12px;
            color: rgba(255,255,255,0.5);
          }
          .channel-status {
            font-size: 11px;
            color: #4ECDC4;
            background: rgba(78,205,196,0.1);
            padding: 2px 8px;
            border-radius: 10px;
            display: inline-block;
          }
          .channel-handle {
            font-size: 11px;
            color: rgba(255,255,255,0.6);
            word-break: break-all;
          }
          .channel-btn {
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            margin-top: 4px;
          }
          .channel-btn-connect {
            background: rgba(255,255,255,0.1);
            color: #fff;
          }
          .channel-btn-connect:hover {
            background: rgba(255,255,255,0.2);
          }
          .channel-btn-disconnect {
            background: rgba(255,100,100,0.2);
            color: #ff6464;
          }
          .channel-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          .demo-badge {
            font-size: 10px;
            color: #FFD700;
            background: rgba(255,215,0,0.1);
            padding: 2px 6px;
            border-radius: 6px;
            margin-left: 4px;
          }
        `}</style>

        <div className="channel-modal-header">
          <span className="channel-modal-title">Connect Channels</span>
          <button className="channel-modal-close" onClick={onClose}>✕</button>
        </div>

        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '20px' }}>
            Loading channels...
          </div>
        ) : (
          <div className="channel-grid">
            {CHANNEL_CONFIGS.map((config) => {
              const existing = connectedMap[config.type];
              const result = connectResults[config.type];
              const isConnected = existing?.status === 'connected';
              const isDemo = result?.status === 'demo' || existing?.status === 'demo';
              const isLoading = connecting === config.type;

              return (
                <div key={config.type} className={`channel-card${isConnected ? ' connected' : ''}`}>
                  <div className="channel-card-header">
                    <span className="channel-icon">{config.icon}</span>
                    <span className="channel-label">{config.label}</span>
                    {isDemo && <span className="demo-badge">Demo</span>}
                  </div>
                  <div className="channel-desc">{config.description}</div>
                  {(isConnected || isDemo) && (
                    <span className="channel-status">
                      {isDemo ? 'Demo Mode' : 'Connected'}
                    </span>
                  )}
                  {(existing?.handle || result?.handle) && (
                    <div className="channel-handle">
                      {existing?.handle || result?.handle}
                    </div>
                  )}
                  {(existing?.deepLink || result?.deepLink) && (
                    <a
                      href={existing?.deepLink || result?.deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 11, color: '#4ECDC4' }}
                    >
                      Open Link ↗
                    </a>
                  )}
                  {isConnected ? (
                    <button
                      className="channel-btn channel-btn-disconnect"
                      disabled={isLoading}
                      onClick={() => handleDisconnect(config.type)}
                    >
                      {isLoading ? 'Disconnecting...' : 'Disconnect'}
                    </button>
                  ) : (
                    <button
                      className="channel-btn channel-btn-connect"
                      disabled={isLoading}
                      onClick={() => handleConnect(config.type)}
                    >
                      {isLoading ? 'Connecting...' : 'Connect'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
