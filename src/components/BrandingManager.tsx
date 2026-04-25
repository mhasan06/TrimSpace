"use client";

import { useState } from "react";
import { updateTenantBranding } from "../app/dashboard/settings/actions";
import { getTerminology } from "@/lib/terminology";
import ImageUpload from "./ImageUpload";

function PersonaPreview({ category }: { category: string }) {
    const t = getTerminology(category);
    const tags = [
        { label: "Staff Called",   value: `${t.staffLabel} / ${t.staffLabelPlural}`,   icon: "👤" },
        { label: "Services Called", value: `${t.serviceLabel} / ${t.serviceLabelPlural}`, icon: "📋" },
        { label: "Roster Label",   value: t.rosterLabel,                                icon: "📅" },
        { label: "Action Verb",    value: t.actionVerb,                                 icon: "⚡" },
    ];

    return (
        <div style={{
            padding: '1.25rem',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.02)',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{t.industryIcon}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--primary)' }}>
                    Live Persona Preview
                </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                {tags.map(tag => (
                    <div key={tag.label} style={{
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        border: '1px solid var(--border)',
                    }}>
                        <p style={{ fontSize: '0.65rem', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.3rem' }}>
                            {tag.icon} {tag.label}
                        </p>
                        <p style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--foreground)' }}>{tag.value}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function BrandingManager({ 
    tenantId, initialName, initialSlug, initialAddress, initialCategory, initialTemplate, initialABN, initialShopImage, initialGallery = [], initialCustomerPhotos = [], initialDescription = "", initialPhone = "",
    initialStreet = "", initialSuburb = "", initialState = "", initialPhoneCode = "+61", initialBusinessName = "", initialWebsite = ""
}: { 
    tenantId: string, 
    initialName: string, 
    initialSlug: string, 
    initialAddress?: string,
    initialCategory?: string,
    initialTemplate?: string,
    initialABN?: string,
    initialShopImage?: string,
    initialGallery?: string[],
    initialCustomerPhotos?: string[],
    initialDescription?: string,
    initialPhone?: string,
    initialStreet?: string,
    initialSuburb?: string,
    initialState?: string,
    initialPhoneCode?: string,
    initialBusinessName?: string,
    initialWebsite?: string
}) {
    const [name, setName] = useState(initialName || "");
    const [slug, setSlug] = useState(initialSlug || "");
    const [street, setStreet] = useState(initialStreet || "");
    const [suburb, setSuburb] = useState(initialSuburb || "");
    const [state, setState] = useState(initialState || "");
    const [phoneCode, setPhoneCode] = useState(initialPhoneCode || "+61");
    const [phone, setPhone] = useState(initialPhone || "");
    const [category, setCategory] = useState(initialCategory || "BARBER");
    const [templateId, setTemplateId] = useState(initialTemplate || "LUXURY");
    const [abn, setAbn] = useState(initialABN || "00 000 000 000");
    const [businessName, setBusinessName] = useState(initialBusinessName || "");
    const [website, setWebsite] = useState(initialWebsite || "");
    const [shopImage, setShopImage] = useState(initialShopImage || "");
    const [gallery, setGallery] = useState<string[]>(initialGallery || []);
    const [customerPhotos, setCustomerPhotos] = useState<string[]>(initialCustomerPhotos || []);
    const [description, setDescription] = useState(initialDescription || "");
    const [saving, setSaving] = useState(false);

    const updateGallerySlot = (index: number, url: string) => {
        const newGallery = [...gallery];
        while(newGallery.length <= index) newGallery.push("");
        newGallery[index] = url;
        setGallery(newGallery);
    };

    const updateCustomerPhotoSlot = (index: number, url: string) => {
        const newPhotos = [...customerPhotos];
        while(newPhotos.length <= index) newPhotos.push("");
        newPhotos[index] = url;
        setCustomerPhotos(newPhotos);
    };

    const handleSave = async () => {
        setSaving(true);
        const res = await updateTenantBranding(
            tenantId, name, slug, "", category, templateId, abn, shopImage, gallery, customerPhotos, description, phone,
            street, suburb, state, phoneCode, businessName, website
        );
        if (res?.error) {
            alert(res.error);
        } else {
            alert("Digital identity and social proof updated successfully!");
        }
        setSaving(false);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase' }}>Shop Name (Public)</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                style={{ width: '100%', padding: '0.8rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--foreground)' }} 
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase' }}>Industry Category</label>
                            <select 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)} 
                                style={{ width: '100%', padding: '0.8rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--foreground)' }}
                            >
                                <option value="BARBER">Barbershop</option>
                                <option value="SALON">Hair Salon</option>
                                <option value="SPA">Spa & Wellness</option>
                                <option value="SKIN">Skin Care</option>
                                <option value="NAILS">Nails</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem', display: 'block' }}>Legal & Registration</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', opacity: 0.5 }}>Legal Entity Name</label>
                                <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--foreground)' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', opacity: 0.5 }}>ABN</label>
                                    <input type="text" value={abn} onChange={(e) => setAbn(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--foreground)' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.7rem', opacity: 0.5 }}>Website</label>
                                    <input type="text" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '0.6rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--foreground)' }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}>
                        <label style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem', display: 'block' }}>Physical Address</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input type="text" placeholder="Street" value={street} onChange={(e) => setStreet(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--foreground)' }} />
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                                <input type="text" placeholder="Suburb" value={suburb} onChange={(e) => setSuburb(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--foreground)' }} />
                                <input type="text" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} style={{ width: '100%', padding: '0.6rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--foreground)' }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase' }}>Contact Phone</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <select value={phoneCode} onChange={(e) => setPhoneCode(e.target.value)} style={{ padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', width: '90px' }}>
                                <option value="+61">+61</option>
                                <option value="+1">+1</option>
                                <option value="+44">+44</option>
                                <option value="+64">+64</option>
                            </select>
                            <input 
                                type="tel" 
                                value={phone} 
                                onChange={(e) => setPhone(e.target.value)} 
                                placeholder="0400 000 000"
                                style={{ flex: 1, padding: '0.8rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--foreground)' }} 
                            />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase' }}>Storefront Description</label>
                        <textarea 
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)} 
                            placeholder="Share your story, specialty, and values..."
                            style={{ width: '100%', height: '100px', padding: '0.8rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--foreground)', resize: 'none' }} 
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.8rem', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase' }}>Shop Portfolio & Customer Showcase</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
                         <div style={{ gridColumn: 'span 3' }}>
                            <ImageUpload 
                                tenantId={tenantId} 
                                currentImage={shopImage} 
                                label="Main Cover" 
                                height="180px"
                                onUploadSuccess={(url) => setShopImage(url)} 
                            />
                         </div>
                         <ImageUpload tenantId={tenantId} currentImage={gallery[0] || ""} label="Interior #1" height="100px" onUploadSuccess={(url) => updateGallerySlot(0, url)} />
                         <ImageUpload tenantId={tenantId} currentImage={gallery[1] || ""} label="Interior #2" height="100px" onUploadSuccess={(url) => updateGallerySlot(1, url)} />
                         <ImageUpload tenantId={tenantId} currentImage={customerPhotos[0] || ""} label="Customer #1" height="100px" onUploadSuccess={(url) => updateCustomerPhotoSlot(0, url)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                         <ImageUpload tenantId={tenantId} currentImage={customerPhotos[1] || ""} label="Customer #2" height="100px" onUploadSuccess={(url) => updateCustomerPhotoSlot(1, url)} />
                         <ImageUpload tenantId={tenantId} currentImage={customerPhotos[2] || ""} label="Customer #3" height="100px" onUploadSuccess={(url) => updateCustomerPhotoSlot(2, url)} />
                    </div>
                </div>
            </div>

            <PersonaPreview category={category} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase' }}>Custom URL</label>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden', maxWidth: '400px' }}>
                        <span style={{ padding: '0.8rem', opacity: 0.4 }}>trimspace.co/</span>
                        <input 
                            type="text" 
                            disabled
                            value={slug} 
                            style={{ width: '100%', padding: '0.8rem', background: 'transparent', border: 'none', color: 'var(--foreground)', opacity: 0.5 }} 
                        />
                    </div>
                </div>
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    style={{ padding: '1.2rem 3rem', background: 'var(--primary)', border: 'none', color: 'black', borderRadius: '12px', fontWeight: 900, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
                    {saving ? "Deploying..." : "Update Storefront"}
                </button>
            </div>
        </div>
    );
}
