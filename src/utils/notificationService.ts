import { Task } from '../types';
import { AGENT_LIBRARY } from '../data/agentLibrary';

export interface InAppNotificationEvent {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'due_soon';
  timestamp: string;
  task: Task;
}

const NOTIFIED_KEY_PREFIX = 'ai_eng_os_notified_';

export class NotificationService {
  /**
   * Check browser Notification API permission state
   */
  public static getPermissionState(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  /**
   * Request native browser notification permission
   */
  public static async requestPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return Notification.permission || 'denied';
    }
  }

  /**
   * Trigger local browser notification + dispatch in-app toast event
   */
  public static triggerTaskNotification(
    task: Task,
    triggerType: 'critical' | 'due_soon',
    hoursRemaining?: number
  ): void {
    const agent = AGENT_LIBRARY.find((a) => a.id === task.assignedAgentId);
    const agentName = agent ? agent.name : 'Unassigned Agent';

    let title = '';
    let message = '';

    if (triggerType === 'critical') {
      title = `🚨 CRITICAL TASK ALERT: ${task.title}`;
      message = `Priority set to Critical! Assigned to ${agentName}. Status: ${task.status.toUpperCase()}.`;
    } else {
      const hoursText = hoursRemaining !== undefined ? `${hoursRemaining.toFixed(1)}h` : '<24h';
      title = `⏰ TASK DUE SOON (${hoursText}): ${task.title}`;
      message = `Due date: ${task.dueDate || 'Today'}. Priority: ${task.priority}. Assigned to ${agentName}.`;
    }

    // 1. Native Browser Notification
    if (this.getPermissionState() === 'granted') {
      try {
        const notif = new Notification(title, {
          body: message,
          tag: `task-${task.id}-${triggerType}`,
        });

        notif.onclick = () => {
          window.focus();
        };
      } catch (err) {
        console.warn('Browser Notification construction failed (iFrame restriction):', err);
      }
    }

    // 2. Dispatch in-app Toast Event for UI fallback
    if (typeof window !== 'undefined') {
      const eventDetail: InAppNotificationEvent = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        message,
        type: triggerType,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        task,
      };

      window.dispatchEvent(
        new CustomEvent('app-task-notification', {
          detail: eventDetail,
        })
      );
    }
  }

  /**
   * Evaluate a task against critical priority and 24-hour due date thresholds
   */
  public static evaluateAndNotifyTask(task: Task, forceTrigger: boolean = false): void {
    if (!task) return;

    // Do not notify completed tasks
    if (task.status === 'completed') return;

    const taskKey = `${task.id}_${task.updatedAt || task.createdAt}`;

    // 1. Critical Priority Check
    if (task.priority === 'Critical') {
      const criticalNotifiedKey = `${NOTIFIED_KEY_PREFIX}critical_${taskKey}`;
      if (forceTrigger || !sessionStorage.getItem(criticalNotifiedKey)) {
        this.triggerTaskNotification(task, 'critical');
        sessionStorage.setItem(criticalNotifiedKey, 'true');
      }
    }

    // 2. Due Date Within 24 Hours Check
    if (task.dueDate) {
      const dueMs = new Date(task.dueDate).getTime();
      const nowMs = Date.now();
      const diffMs = dueMs - nowMs;
      const hoursRemaining = diffMs / (1000 * 60 * 60);

      // Trigger if due date is within 24 hours (and not expired past 6 hours)
      if (hoursRemaining <= 24 && hoursRemaining >= -6) {
        const dueNotifiedKey = `${NOTIFIED_KEY_PREFIX}due_${taskKey}`;
        if (forceTrigger || !sessionStorage.getItem(dueNotifiedKey)) {
          this.triggerTaskNotification(task, 'due_soon', Math.max(0, hoursRemaining));
          sessionStorage.setItem(dueNotifiedKey, 'true');
        }
      }
    }
  }

  /**
   * Batch evaluate an entire list of tasks
   */
  public static evaluateAllTasks(tasks: Task[]): void {
    tasks.forEach((t) => this.evaluateAndNotifyTask(t, false));
  }
}
