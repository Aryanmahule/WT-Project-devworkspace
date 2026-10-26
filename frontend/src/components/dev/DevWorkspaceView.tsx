import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Play,
  Square,
  RotateCw,
  Terminal,
  Activity,
  Cpu,
  HardDrive,
  Copy,
  Check,
  Server,
  Code
} from 'lucide-react';
import { DevEnvironment } from '../../types';
import { api } from '../../services/api';

export const DevWorkspaceView: React.FC = () => {
  const [environments, setEnvironments] = useState<DevEnvironment[]>([]);
  const [dockerStatus, setDockerStatus] = useState<any>(null);
  const [terminalOutput, setTerminalOutput] = useState<string>(
    'Apex Dev Terminal Ready. Select an authorized tool below to inspect the environment.'
  );
  const [activeCommand, setActiveCommand] = useState<string>('');
  const [runningCmd, setRunningCmd] = useState<boolean>(false);
  const [copiedCompose, setCopiedCompose] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'containers' | 'terminal' | 'compose'>('containers');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    loadDevData();
  }, []);

  const loadDevData = async () => {
    try {
      const [envsRes, docRes] = await Promise.all([
        api.getDevEnvironments(),
        api.getDockerStatus(),
      ]);
      setEnvironments(envsRes.environments || []);
      setDockerStatus(docRes);
    } catch (err) {
      console.error('Failed to load dev environments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: string) => {
    try {
      const res = await api.devEnvironmentAction(id, action);
      setEnvironments((prev) =>
        prev.map((e) => (e.id === id ? res.environment : e))
      );
    } catch (err: any) {
      alert(err.message || 'Action failed');
    }
  };

  const runCommand = async (commandKey: string) => {
    setActiveCommand(commandKey);
    setRunningCmd(true);
    setTerminalOutput(`$ executing sandboxed tool: [${commandKey}]...\n`);
    try {
      const res = await api.runSandboxedCommand(commandKey);
      setTerminalOutput(
        `$ ${res.command_line}\n[Exit Code: ${res.exit_code}] [Logged to Audit Trail]\n\n${res.output || '(No standard output)'}`
      );
    } catch (err: any) {
      setTerminalOutput(`$ Error executing tool: ${err.message}`);
    } finally {
      setRunningCmd(false);
    }
  };

  const composeConfig = `version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: apex-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: devplatform
      MYSQL_USER: devuser
      MYSQL_PASSWORD: devpassword
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: apex-backend
    restart: always
    ports:
      - "5050:5050"
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=mysql+pymysql://devuser:devpassword@mysql:3306/devplatform
    depends_on:
      - mysql

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: apex-frontend
    restart: always
    ports:
      - "3002:80"
    depends_on:
      - backend

volumes:
  mysql_data:`;

  const copyComposeYaml = () => {
    navigator.clipboard.writeText(composeConfig);
    setCopiedCompose(true);
    setTimeout(() => setCopiedCompose(false), 2000);
  };

  return (
    <div className="max-w-content mx-auto p-8 space-y-8">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-page-title text-text-main font-semibold">
            Developer Hub & Sandboxes
          </h1>
          <p className="text-secondary text-text-muted mt-1">
            Orchestrate containerized services, inspect telemetry metrics, and run sandboxed diagnostics with audit logging
          </p>
        </div>

        {/* Tab switch */}
        <div className="inline-flex p-1 bg-surface border border-border rounded-[8px] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('containers')}
            className={`px-3 py-1.5 rounded-[6px] text-secondary font-medium transition-colors ${
              activeTab === 'containers'
                ? 'bg-accent-subtle text-accent'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            Containers & Services
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1.5 rounded-[6px] text-secondary font-medium transition-colors ${
              activeTab === 'terminal'
                ? 'bg-accent-subtle text-accent'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            Diagnostic Tools
          </button>
          <button
            onClick={() => setActiveTab('compose')}
            className={`px-3 py-1.5 rounded-[6px] text-secondary font-medium transition-colors ${
              activeTab === 'compose'
                ? 'bg-accent-subtle text-accent'
                : 'text-text-muted hover:text-text-main'
            }`}
          >
            Docker Compose
          </button>
        </div>
      </div>

      {/* Containers Tab */}
      {activeTab === 'containers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {environments.map((env) => {
              const isRunning = env.status === 'running';
              return (
                <div key={env.id} className="ui-card flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isRunning ? 'bg-[#12B76A]' : 'bg-danger'
                          }`}
                        />
                        <span className="text-card-title text-text-main font-semibold">
                          {env.name}
                        </span>
                      </div>
                      <span className={`badge ${isRunning ? 'badge-completed' : 'badge-blocked'}`}>
                        {env.status}
                      </span>
                    </div>

                    <div className="text-secondary text-text-muted mb-4 font-mono text-[12px]">
                      {env.image_tag} &middot; {env.port_mappings}
                    </div>

                    {/* Telemetry Metrics */}
                    <div className="grid grid-cols-2 gap-3 bg-page p-3 rounded-[8px] border border-border mb-4">
                      <div className="flex items-center gap-2">
                        <Cpu size={16} className="text-accent" />
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-text-muted">CPU</div>
                          <div className="text-body font-semibold text-text-main">{env.cpu_usage}%</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <HardDrive size={16} className="text-accent" />
                        <div>
                          <div className="text-[10px] uppercase font-semibold text-text-muted">Memory</div>
                          <div className="text-body font-semibold text-text-main">{env.memory_usage}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-secondary text-text-muted font-mono text-[12px]">
                      ID #{env.id}
                    </span>
                    <div className="flex items-center gap-2">
                      {isRunning ? (
                        <>
                          <button
                            onClick={() => handleAction(env.id, 'stop')}
                            className="btn-outlined btn-sm"
                            title="Stop container"
                          >
                            <Square size={13} /> Stop
                          </button>
                          <button
                            onClick={() => handleAction(env.id, 'restart')}
                            className="btn-outlined btn-sm"
                            title="Restart container"
                          >
                            <RotateCw size={13} /> Restart
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleAction(env.id, 'start')}
                          className="btn-accent btn-sm"
                          title="Start container"
                        >
                          <Play size={13} /> Start
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Docker Status Overview */}
          <div className="ui-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server size={18} className="text-accent" />
                <h3 className="text-card-title text-text-main font-semibold">
                  Docker Daemon Environment
                </h3>
              </div>
              <span className="badge badge-completed">
                {dockerStatus?.docker_available ? 'Daemon Active' : 'Virtual Sandbox'}
              </span>
            </div>
            <p className="text-secondary text-text-muted leading-relaxed">
              Active workspace is configured with dynamic container orchestration. Containers execute inside an isolated micro-environment with automated health inspection, resource throttles, and structured volume mounts.
            </p>
          </div>
        </div>
      )}

      {/* Terminal / Diagnostics Tab */}
      {activeTab === 'terminal' && (
        <div className="space-y-6">
          <div className="ui-card">
            <h3 className="text-card-title text-text-main font-semibold mb-3">
              Diagnostic & Audit Tools
            </h3>
            <p className="text-secondary text-text-muted mb-4">
              Run sandboxed commands against the running containers and database engine. Every command execution is logged in the corporate audit trail.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'docker_ps', label: 'docker ps (all containers)' },
                { key: 'docker_stats', label: 'docker stats --no-stream' },
                { key: 'git_status', label: 'git status & branch' },
                { key: 'check_migrations', label: 'verify db schema' },
                { key: 'test_db_ping', label: 'ping database' },
              ].map((cmd) => (
                <button
                  key={cmd.key}
                  disabled={runningCmd}
                  onClick={() => runCommand(cmd.key)}
                  className={`btn-sm ${
                    activeCommand === cmd.key ? 'btn-accent' : 'btn-outlined'
                  }`}
                >
                  <Terminal size={14} />
                  <span>{cmd.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Terminal Box */}
          <div className="ui-card bg-[#16181D] text-[#F5F6F8] border-none font-mono text-[13px] p-6 rounded-[10px] overflow-x-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 text-text-muted">
              <div className="flex items-center gap-2 text-[12px]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#12B76A]" />
                <span>sandbox-session: active</span>
              </div>
              {runningCmd && <span className="text-accent animate-pulse">Executing...</span>}
            </div>
            <pre className="whitespace-pre-wrap leading-relaxed font-mono">
              {terminalOutput}
            </pre>
          </div>
        </div>
      )}

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <div className="ui-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code size={18} className="text-accent" />
              <h3 className="text-card-title text-text-main font-semibold">
                docker-compose.yml Specification
              </h3>
            </div>
            <button
              onClick={copyComposeYaml}
              className="btn-outlined btn-sm"
            >
              {copiedCompose ? (
                <>
                  <Check size={14} className="text-[#12B76A]" /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy YAML
                </>
              )}
            </button>
          </div>
          <p className="text-secondary text-text-muted">
            Declarative deployment blueprint for all workspace services, databases, and microservices.
          </p>
          <div className="bg-[#16181D] text-[#F5F6F8] p-5 rounded-[8px] font-mono text-[13px] overflow-x-auto">
            <pre className="whitespace-pre-wrap leading-relaxed">
              {composeConfig}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
