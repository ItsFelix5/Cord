/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { classNameFactory } from "@api/Styles";
import DonateButton from "@components/DonateButton";
import { openPluginModal } from "@components/PluginSettings/PluginModal";
import { Margins } from "@utils/margins";
import { Button, Card, Forms, React, Select, Switch } from "@webpack/common";

import { Flex, GithubIcon, LogIcon, PaintbrushIcon, RestartIcon } from "..";
import { openNotificationSettingsModal } from "./NotificationSettings";
import { QuickAction, QuickActionCard } from "./quickActions";
import { SettingsTab, wrapTab } from "./shared";

const cl = classNameFactory("vc-settings-");

function VencordSettings() {
    const settings = useSettings();

    return (
        <SettingsTab title="Vencord Settings">
            <DonateCard image={"https://cdn.discordapp.com/emojis/1026533090627174460.png"} />
            <Forms.FormSection title="Quick Actions">
                <QuickActionCard>
                    <QuickAction
                        Icon={LogIcon}
                        text="Notification Log"
                        action={openNotificationLogModal}
                    />
                    <QuickAction
                        Icon={PaintbrushIcon}
                        text="Edit QuickCSS"
                        action={() => VencordNative.quickCss.openEditor()}
                    />
                    (
                        <QuickAction
                            Icon={RestartIcon}
                            text="Reload Discord"
                            action={location.reload}
                        />
                    )
                    <QuickAction
                        Icon={GithubIcon}
                        text="View Source Code"
                        action={() => open("https://github.com/ItsFelix5/Cord/tree/vencord")}
                    />
                </QuickActionCard>
            </Forms.FormSection>

            <Forms.FormDivider />

            <Forms.FormSection className={Margins.top16} title="Settings" tag="h5">
                <Forms.FormText className={Margins.bottom20} style={{ color: "var(--text-muted)" }}>
                    Hint: You can change the position of this settings section in the
                    {" "}<Button
                        look={Button.Looks.BLANK}
                        style={{ color: "var(--text-link)", display: "inline-block" }}
                        onClick={() => openPluginModal(Vencord.Plugins.plugins.Settings)}
                    >
                        settings of the Settings plugin
                    </Button>!
                </Forms.FormText>

				<Switch key='useQuickCss' value={settings.useQuickCss} onChange={v => (settings.useQuickCss = v)} note='Loads your Custom CSS'>
					Enable Custom CSS
				</Switch>
				<Switch key='autoStart' value={window.__TAURI__.autostart.isEnabled()} onChange={v => window.__TAURI__.autostart[v ? 'enable' : 'disable']()}>
					Start Cord automatically when your computer starts
				</Switch>
            </Forms.FormSection>

            <Forms.FormSection className={Margins.top16} title="Vencord Notifications" tag="h5">
                <Flex>
                    <Button onClick={openNotificationSettingsModal}>
                        Notification Settings
                    </Button>
                    <Button onClick={openNotificationLogModal}>
                        View Notification Log
                    </Button>
                </Flex>
            </Forms.FormSection>
        </SettingsTab>
    );
}

interface DonateCardProps {
    image: string;
}

function DonateCard({ image }: DonateCardProps) {
    return (
        <Card className={cl("card", "donate")}>
            <div>
                <Forms.FormTitle tag="h5">Support the Project</Forms.FormTitle>
                <Forms.FormText>Please consider supporting the development of Vencord by donating!</Forms.FormText>
                <DonateButton style={{ transform: "translateX(-1em)" }} />
            </div>
            <img
                role="presentation"
                src={image}
                alt=""
                height={128}
                style={{
                    marginLeft: "auto",
                    transform: "rotate(10deg)"
                }}
            />
        </Card>
    );
}

export default wrapTab(VencordSettings, "Vencord Settings");
