import { Matrix4, PerspectiveCamera, Quaternion, Vector3 } from 'three';
import type { ViewState } from '../types';

export const SCREEN_WIDTH = 1120;
export const SCREEN_HEIGHT = 700;
export const SCREEN_WORLD_WIDTH = 2.88;
export const SCREEN_WORLD_HEIGHT = SCREEN_WORLD_WIDTH * SCREEN_HEIGHT / SCREEN_WIDTH;
export const SCREEN_CENTER = new Vector3(0, 1.6, 0.135);

type Pose = { position: Vector3; rotation: Quaternion };
type Transition = { from: Pose; to: Pose; started: number; duration: number; destination: 'seated' | 'focused' };

/** Owns every camera pose, including interrupted transitions and resize fitting. */
export class RoomCamera {
  private state: ViewState = 'seated';
  private width = 1;
  private height = 1;
  private reducedMotion: boolean;
  private transition: Transition | undefined;
  private pointer = { x: 0, y: 0 };
  private head = { x: 0, y: 0 };
  private readonly seatPosition = new Vector3(0.12, 2.08, 5.75);
  private readonly seatTarget = new Vector3(0, 1.48, -0.35);
  private readonly up = new Vector3(0, 1, 0);

  constructor(private readonly camera: PerspectiveCamera, reducedMotion: boolean, private readonly onState: (state: ViewState) => void) {
    this.reducedMotion = reducedMotion;
    this.applyPose(this.seatPose());
  }

  get viewState(): ViewState { return this.state; }

  resize(width: number, height: number): void {
    this.width = Math.max(width, 1);
    this.height = Math.max(height, 1);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    if (this.state === 'focused') this.applyPose(this.focusPose());
    if (this.transition?.destination === 'focused') {
      const now = performance.now();
      const remaining = Math.max(80, this.transition.duration - (now - this.transition.started));
      this.transition = { ...this.transition, from: this.currentPose(), to: this.focusPose(), started: now, duration: remaining };
    }
  }

  setPointer(x: number, y: number): void {
    this.pointer.x = Math.max(-1, Math.min(1, x));
    this.pointer.y = Math.max(-1, Math.min(1, y));
  }

  focus(): void {
    if (this.state === 'focused' || this.state === 'focusing') return;
    this.begin('focused');
  }

  returnToSeat(): void {
    if (this.state === 'seated' || this.state === 'returning') return;
    this.begin('seated');
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
    this.head.x = this.head.y = 0;
    this.pointer.x = this.pointer.y = 0;
    if (value && this.transition) {
      const destination = this.transition.destination;
      this.transition = undefined;
      this.applyPose(destination === 'focused' ? this.focusPose() : this.seatPose());
      this.publish(destination);
    } else if (this.state === 'seated') this.applyPose(this.seatPose());
  }

  update(now: number, deltaSeconds: number): void {
    const transition = this.transition;
    if (transition) {
      const progress = Math.min(1, Math.max(0, (now - transition.started) / transition.duration));
      const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
      this.camera.position.lerpVectors(transition.from.position, transition.to.position, eased);
      this.camera.quaternion.slerpQuaternions(transition.from.rotation, transition.to.rotation, eased);
      if (progress === 1) {
        this.applyPose(transition.to);
        this.transition = undefined;
        this.publish(transition.destination);
      }
    } else if (this.state === 'seated' && !this.reducedMotion) {
      const damping = 1 - Math.exp(-4 * Math.min(deltaSeconds, 0.1));
      this.head.x += (this.pointer.x - this.head.x) * damping;
      this.head.y += (this.pointer.y - this.head.y) * damping;
      this.camera.position.copy(this.seatPosition);
      this.camera.lookAt(this.seatTarget.x + this.head.x * 0.16, this.seatTarget.y - this.head.y * 0.10, this.seatTarget.z);
    }
  }

  private begin(destination: 'seated' | 'focused'): void {
    this.head.x = this.head.y = 0;
    this.pointer.x = this.pointer.y = 0;
    const to = destination === 'focused' ? this.focusPose() : this.seatPose();
    if (this.reducedMotion) {
      this.transition = undefined;
      this.applyPose(to);
      this.publish(destination);
      return;
    }
    this.transition = { from: this.currentPose(), to, started: performance.now(), duration: 920, destination };
    this.publish(destination === 'focused' ? 'focusing' : 'returning');
  }

  private focusPose(): Pose {
    const halfFov = this.camera.fov * Math.PI / 360;
    // Leave room around the physical screen for the ordinary DOM return control.
    const availableWidth = Math.max(this.width - 80, this.width * 0.78) / this.width;
    const availableHeight = Math.max(this.height - 128, this.height * 0.70) / this.height;
    const verticalDistance = SCREEN_WORLD_HEIGHT / (2 * Math.tan(halfFov) * availableHeight);
    const horizontalDistance = SCREEN_WORLD_WIDTH / (2 * Math.tan(halfFov) * this.camera.aspect * availableWidth);
    const position = SCREEN_CENTER.clone().add(new Vector3(0, 0, Math.max(verticalDistance, horizontalDistance)));
    return this.poseLookingAt(position, SCREEN_CENTER);
  }

  private seatPose(): Pose { return this.poseLookingAt(this.seatPosition, this.seatTarget); }

  private poseLookingAt(position: Vector3, target: Vector3): Pose {
    return { position: position.clone(), rotation: new Quaternion().setFromRotationMatrix(new Matrix4().lookAt(position, target, this.up)) };
  }

  private currentPose(): Pose { return { position: this.camera.position.clone(), rotation: this.camera.quaternion.clone() }; }

  private applyPose(pose: Pose): void {
    this.camera.position.copy(pose.position);
    this.camera.quaternion.copy(pose.rotation);
  }

  private publish(state: ViewState): void {
    this.state = state;
    this.onState(state);
  }
}
